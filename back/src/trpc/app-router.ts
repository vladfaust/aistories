import { initTRPC } from "@trpc/server";
import { z } from "zod";
import * as ai from "@/ai";
import { Deferred } from "@/utils";
import { PrismaClient, HumanMessage, BotMessage } from "@prisma/client";
import EventEmitter from "events";
import { observable } from "@trpc/server/observable";

const prisma = new PrismaClient();
const ee = new EventEmitter();

const t = initTRPC.create();

const router = t.router;
const publicProcedure = t.procedure;

export const appRouter = router({
  createHumanMessage: publicProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      console.log("👤", input);

      const humanMessage = await prisma.humanMessage.create({
        data: {
          text: input,
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
        },
      });

      ee.emit("addHuman", humanMessage);

      const output = new Deferred<string>();

      ai.process.stdout.once("data", async (data: Buffer) => {
        const response = data.toString().trim();
        console.log("🤖", response);
        output.resolve(response);
        const botMessage = await prisma.botMessage.create({
          data: {
            text: response,
            humanMessageId: humanMessage.id,
          },
          select: {
            id: true,
            text: true,
            createdAt: true,
            humanMessageId: true,
          },
        });
        ee.emit("addBot", botMessage);
      });

      ai.process.stdin.write(`${input}\n`);
      await output.promise;
    }),

  getHumanMessages: publicProcedure.query(() => {
    return prisma.humanMessage.findMany({
      select: {
        id: true,
        text: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  getBotMessages: publicProcedure.query(() => {
    return prisma.botMessage.findMany({
      select: {
        id: true,
        text: true,
        createdAt: true,
        humanMessageId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  onHumanMessage: publicProcedure.subscription(() => {
    return observable<HumanMessage>((emit) => {
      const onAdd = (data: HumanMessage) => {
        // emit data to client
        emit.next(data);
      };

      // trigger `onAdd()` when `addHuman` is triggered in our event emitter
      ee.on("addHuman", onAdd);

      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        ee.off("addHuman", onAdd);
      };
    });
  }),

  onBotMessage: publicProcedure.subscription(() => {
    return observable<BotMessage>((emit) => {
      const onAdd = (data: BotMessage) => {
        // emit data to client
        emit.next(data);
      };

      // trigger `onAdd()` when `addBot` is triggered in our event emitter
      ee.on("addBot", onAdd);

      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        ee.off("addBot", onAdd);
      };
    });
  }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
