import { initTRPC } from "@trpc/server";
import { z } from "zod";
import * as ai from "@/ai.js";
import { Deferred } from "@/utils.js";
import { PrismaClient, TextMessage } from "@prisma/client";
import EventEmitter from "events";
import { observable } from "@trpc/server/observable";
import * as elevenLabs from "@/services/elevenLabs.js";

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

        const [botMessage, tts] = await Promise.all([
          prisma.textMessage.create({
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
          }),
          await elevenLabs.tts(response, "21m00Tcm4TlvDq8ikWAM"),
        ]);

        ee.emit("chatMessage", {
          ...botMessage,
          tts,
        });

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
    return observable<TextMessage & { tts?: string }>((emit) => {
      const onAdd = (data: TextMessage & { tts?: ArrayBuffer }) => {
        emit.next({
          ...data,
          tts: data.tts ? Buffer.from(data.tts).toString("base64") : undefined,
        });
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
