import { initTRPC } from "@trpc/server";
import { z } from "zod";
import * as ai from "@/ai.js";
import { Deferred } from "@/utils.js";
import { PrismaClient, TextMessage } from "@prisma/client";
import EventEmitter from "events";
import { observable } from "@trpc/server/observable";

const prisma = new PrismaClient();
const ee = new EventEmitter();

const t = initTRPC.create();

const router = t.router;
const publicProcedure = t.procedure;

export const appRouter = router({
  createUserMessage: publicProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      console.log("👤", input);

      const userMessage = await prisma.textMessage.create({
        data: {
          chatId: 1,
          actorId: 1,
          text: input,
        },
        select: {
          id: true,
          chatId: true,
          actorId: true,
          text: true,
          createdAt: true,
        },
      });
      ee.emit("chatMessage", userMessage);

      const output = new Deferred<string>();

      ai.process.stdout.once("data", async (data: Buffer) => {
        const response = data.toString().trim();
        console.log("🤖", response);

        const botMessage = await prisma.textMessage.create({
          data: {
            chatId: 1,
            actorId: 2,
            text: response,
          },
          select: {
            id: true,
            chatId: true,
            actorId: true,
            text: true,
            createdAt: true,
          },
        });
        ee.emit("chatMessage", botMessage);

        output.resolve(response);
      });

      ai.process.stdin.write(`${input}\n`);
      await output.promise;
    }),

  getChatMessages: publicProcedure.query(() => {
    return prisma.textMessage.findMany({
      select: {
        id: true,
        chatId: true,
        actorId: true,
        text: true,
        createdAt: true,
      },
      where: {
        chatId: 1,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  onChatMessage: publicProcedure.subscription(() => {
    return observable<TextMessage>((emit) => {
      const onAdd = (data: TextMessage) => {
        emit.next(data);
      };

      ee.on("chatMessage", onAdd);

      return () => {
        ee.off("chatMessage", onAdd);
      };
    });
  }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
