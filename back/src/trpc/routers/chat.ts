import { z } from "zod";
import { t } from "../index";
import * as ai from "@/ai.js";
import { Deferred } from "@/utils.js";
import { PrismaClient, TextMessage } from "@prisma/client";
import EventEmitter from "events";
import { observable } from "@trpc/server/observable";
import { upsertUser } from "../context";

function chatMessageChannelName(userId: number, characterId: number) {
  return `chatMessage:${userId}:${characterId}`;
}

function chatMessageTokenChannelName(userId: number, characterId: number) {
  return `chatMessageToken:${userId}:${characterId}`;
}

const SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const prisma = new PrismaClient();
const ee = new EventEmitter();

export default t.router({
  initialize: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        characterId: z.number().positive(),
      })
    )
    .output(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const chat = await prisma.chat.upsert({
        where: {
          userId_characterId: {
            userId: inputAuth.actorId,
            characterId: input.characterId,
          },
        },
        update: {},
        create: {
          userId: inputAuth.actorId,
          characterId: input.characterId,
        },
      });

      let session = await prisma.chatSession.findFirst({
        where: {
          chatId: chat.id,
          endedAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          pid: true,
        },
      });

      if (session) {
        console.log("Found existing session", {
          chatId: chat.id,
          sessionId: session.id,
        });

        if (ai.processes[session.pid]) {
          console.log("Process is alive", {
            sessionId: session.id,
            pid: session.pid,
          });
        } else {
          console.log("Re-spawning process...", {
            sessionId: session.id,
            pid: session.pid,
          });

          const process = ai.spawnProcess();

          await prisma.chatSession.update({
            where: {
              id: session.id,
            },
            data: {
              pid: process.pid!,
            },
          });
        }
      }

      if (!session) {
        console.log("Creating new session...", { chatId: chat.id });

        const process = ai.spawnProcess();

        session = await prisma.chatSession.create({
          data: {
            pid: process.pid!,
            Chat: {
              connect: {
                id: chat.id,
              },
            },
            endedAt: new Date(new Date().valueOf() + SESSION_DURATION_MS),
          },
        });
      }

      return {
        sessionId: session.id,
      };
    }),

  // TODO: Prohibit sending messages if the session is busy.
  sendMessage: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        sessionId: z.number().positive(),
        text: z.string(),
      })
    )
    .output(z.object({ characterMessageId: z.number() }))
    .mutation(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const session = await prisma.chatSession.findUnique({
        where: {
          id: input.sessionId,
        },
        select: {
          id: true,
          pid: true,
          endedAt: true,
          Chat: {
            select: {
              id: true,
              userId: true,
              characterId: true,
            },
          },
        },
      });

      if (!session || session.Chat.userId != inputAuth.actorId) {
        throw new Error("Session not found");
      } else if (session.endedAt < new Date()) {
        throw new Error("Session expired");
      }

      const process = ai.processes[session.pid];
      if (!process) {
        throw new Error("Process not found, re-initialize session");
      }

      console.log("👤", {
        sessionId: input.sessionId,
        text: input.text,
      });

      const userMessage = await prisma.textMessage.create({
        data: {
          chatId: session.Chat.id,
          actorId: inputAuth.actorId,
          text: input.text,
        },
        select: {
          id: true,
          chatId: true,
          actorId: true,
          text: true,
          createdAt: true,
        },
      });

      ee.emit(
        chatMessageChannelName(inputAuth.actorId, session.Chat.characterId),
        userMessage
      );

      const characterMessage = await prisma.textMessage.create({
        data: {
          chatId: session.Chat.id,
          actorId: session.Chat.characterId,
        },
        select: {
          id: true,
          chatId: true,
          actorId: true,
          createdAt: true,
        },
      });

      ee.emit(
        chatMessageChannelName(inputAuth.actorId, session.Chat.characterId),
        characterMessage
      );

      const text = new Deferred<string>();
      let textBuffer = "";

      process.stdout!.on("data", async (data: Buffer) => {
        const token = data.toString();
        console.debug("🤖 (tok)", token);

        ee.emit(
          chatMessageTokenChannelName(
            inputAuth.actorId,
            session.Chat.characterId
          ),
          {
            messageId: characterMessage.id,
            token,
          }
        );

        if (token == "\0") {
          console.log("🤖", textBuffer);
          text.resolve(textBuffer);
          return;
        }

        textBuffer += token;
      });

      process.stdin!.write(`${input.text}\n`);

      await prisma.textMessage.update({
        where: {
          id: characterMessage.id,
        },
        data: {
          text: await text.promise,
        },
      });

      process.stdout!.removeAllListeners("data");

      return {
        characterMessageId: characterMessage.id,
      };
    }),

  getRecentMessages: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        characterId: z.number().positive(),
      })
    )
    .query(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const chat = await prisma.chat.findUnique({
        where: {
          userId_characterId: {
            userId: inputAuth.actorId,
            characterId: input.characterId,
          },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!chat || chat.userId !== inputAuth.actorId) {
        throw new Error("Chat not found");
      }

      return prisma.textMessage.findMany({
        select: {
          id: true,
          chatId: true,
          actorId: true,
          text: true,
          createdAt: true,
        },
        where: {
          chatId: chat.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  onMessage: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        characterId: z.number().positive(),
      })
    )
    .subscription(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const channelName = chatMessageChannelName(
        inputAuth.actorId,
        input.characterId
      );

      return observable<TextMessage>((emit) => {
        const onAdd = (data: TextMessage) => {
          emit.next(data);
        };

        ee.on(channelName, onAdd);

        return () => {
          ee.off(channelName, onAdd);
        };
      });
    }),

  onMessageToken: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        characterId: z.number().positive(),
      })
    )
    .subscription(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const channelName = chatMessageTokenChannelName(
        inputAuth.actorId,
        input.characterId
      );

      return observable<{ messageId: number; token: string }>((emit) => {
        const onAdd = (data: { messageId: number; token: string }) => {
          emit.next(data);
        };

        ee.on(channelName, onAdd);

        return () => {
          ee.off(channelName, onAdd);
        };
      });
    }),
});
