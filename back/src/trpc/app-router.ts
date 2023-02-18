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

const CHAT_MESSAGE = "chatMessage";
const CHAT_MESSAGE_TOKEN = "chatMessageToken";

export const appRouter = router({
  createUserMessage: publicProcedure
    .input(z.string())
    .output(z.object({ id: z.number() }))
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
      ee.emit(CHAT_MESSAGE, userMessage);

      const characterMessage = await prisma.textMessage.create({
        data: {
          chatId: 1,
          actorId: 2,
        },
        select: {
          id: true,
          chatId: true,
          actorId: true,
          createdAt: true,
        },
      });

      ee.emit(CHAT_MESSAGE, characterMessage);

      const text = new Deferred<string>();
      let textBuffer = "";

      ai.process.stdout.on("data", async (data: Buffer) => {
        const token = data.toString();
        console.debug("🤖 (tok)", token);

        ee.emit(CHAT_MESSAGE_TOKEN, {
          messageId: characterMessage.id,
          token,
        });

        if (token == "\0") {
          console.log("🤖", textBuffer);
          text.resolve(textBuffer);
          return;
        }

        textBuffer += token;
      });

      ai.process.stdin.write(`${input}\n`);

      await prisma.textMessage.update({
        where: {
          id: characterMessage.id,
        },
        data: {
          text: await text.promise,
        },
      });

      return characterMessage;
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

      ee.on(CHAT_MESSAGE, onAdd);

      return () => {
        ee.off(CHAT_MESSAGE, onAdd);
      };
    });
  }),

  onChatMessageToken: publicProcedure.subscription(() => {
    return observable<{ messageId: number; token: string }>((emit) => {
      const onAdd = (data: { messageId: number; token: string }) => {
        emit.next(data);
      };

      ee.on(CHAT_MESSAGE_TOKEN, onAdd);

      return () => {
        ee.off(CHAT_MESSAGE_TOKEN, onAdd);
      };
    });
  }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
