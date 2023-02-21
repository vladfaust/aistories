import { z } from "zod";
import { t } from "../index";
import * as ai from "@/ai.js";
import { Deferred, sleep } from "@/utils.js";
import { PrismaClient, UserMessage, CharacterMessage } from "@prisma/client";
import EventEmitter from "events";
import { observable } from "@trpc/server/observable";
import { upsertUser } from "../context";

type MessageUpdate = {
  messageId: number;
  token?: string;
  textComplete?: boolean;
  finalized?: boolean;
};

function onUserMessageChannelName(userId: number, characterId: number) {
  return `chat:${userId}:${characterId}:userMessage`;
}

function onCharacterMessageChannelName(userId: number, characterId: number) {
  return `chat:${userId}:${characterId}:characterMessage`;
}

function onCharacterMessageUpdateChannelName(
  userId: number,
  characterId: number
) {
  return `chat:${userId}:${characterId}:characterMessageToken`;
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
            userId: inputAuth.id,
            characterId: input.characterId,
          },
        },
        update: {},
        create: {
          userId: inputAuth.id,
          characterId: input.characterId,
        },
        select: {
          id: true,
          conversationSummary: true,
          conversationBuffer: true,
          Character: {
            select: {
              promptTemplate: true,
              summarizerTemplate: true,
            },
          },
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

          const process = ai.spawnProcess({
            promptTemplate: chat.Character.promptTemplate,
            summarizerTemplate: chat.Character.summarizerTemplate || undefined,
            conversationSummary: chat.conversationSummary,
            conversationBuffer: JSON.parse(chat.conversationBuffer),
          });

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

        const process = ai.spawnProcess({
          promptTemplate: chat.Character.promptTemplate,
          summarizerTemplate: chat.Character.summarizerTemplate || undefined,
          conversationSummary: chat.conversationSummary,
          conversationBuffer: JSON.parse(chat.conversationBuffer),
        });

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

      if (!session || session.Chat.userId != inputAuth.id) {
        throw new Error("Session not found");
      } else if (session.endedAt < new Date()) {
        throw new Error("Session expired");
      }

      const latestCharacterMessage = await prisma.characterMessage.findFirst({
        where: {
          chatId: session.Chat.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          finalized: true,
          text: true,
          pid: true,
        },
      });

      if (latestCharacterMessage && !latestCharacterMessage.text) {
        throw new Error(
          "Cannot send message until previous message is finalized"
        );
      }

      const process = ai.processes[session.pid];
      if (!process) {
        throw new Error("Process not found, re-initialize session");
      }

      console.log("👤", {
        sessionId: input.sessionId,
        text: input.text,
      });

      const userMessage = await prisma.userMessage.create({
        data: {
          chatId: session.Chat.id,
          userId: inputAuth.id,
          text: input.text,
        },
        select: {
          id: true,
          chatId: true,
          userId: true,
          text: true,
          createdAt: true,
        },
      });

      ee.emit(
        onUserMessageChannelName(inputAuth.id, session.Chat.characterId),
        userMessage
      );

      const characterMessage = await prisma.characterMessage.create({
        data: {
          chatId: session.Chat.id,
          characterId: session.Chat.characterId,
          finalized: false,
          pid: session.pid,
        },
        select: {
          id: true,
          chatId: true,
          characterId: true,
          createdAt: true,
        },
      });

      ee.emit(
        onCharacterMessageChannelName(inputAuth.id, session.Chat.characterId),
        characterMessage
      );

      if (latestCharacterMessage && !latestCharacterMessage.finalized) {
        if (latestCharacterMessage.pid != session.pid) {
          // Skip waiting if the session has been re-initialized.
          // That means that the message will not persist in history.
        } else {
          let finalized = false;
          let sessionPid = session.pid;

          while (!finalized) {
            await sleep(500);

            [finalized, sessionPid] = await Promise.all([
              (
                await prisma.characterMessage.findUniqueOrThrow({
                  where: {
                    id: latestCharacterMessage.id,
                  },
                  select: {
                    finalized: true,
                  },
                })
              ).finalized,
              (
                await prisma.chatSession.findUniqueOrThrow({
                  where: {
                    id: session.id,
                  },
                  select: {
                    pid: true,
                  },
                })
              ).pid,
            ]);

            if (sessionPid != session.pid) {
              throw new Error("Session re-initialized, try again");
            }
          }
        }
      }

      enum Stage {
        Prediction,
        ConversationSummary,
        ConversationBuffer,
      }

      let stage = Stage.Prediction;

      let token = "";
      let text = "";
      let conversationSummary = "";
      let conversationBuffer = "";

      const textDone = new Deferred<void>();
      const processingDone = new Deferred<void>();

      process.stdout!.on("data", async (data: Buffer) => {
        console.debug("🤖 (data)", data);

        for (const byte of data) {
          switch (stage) {
            case Stage.Prediction: {
              switch (byte) {
                // Start of a token stream.
                case 0x02: {
                  break;
                }

                // End of a token.
                case 0x1f: {
                  console.debug("🤖 (tok)", token);

                  ee.emit(
                    onCharacterMessageUpdateChannelName(
                      inputAuth.id,
                      session.Chat.characterId
                    ),
                    {
                      messageId: characterMessage.id,
                      token,
                    } satisfies MessageUpdate
                  );

                  text += token;
                  token = "";

                  break;
                }

                // End of a token stream.
                case 0x03: {
                  console.log("🤖 (say)", text);

                  ee.emit(
                    onCharacterMessageUpdateChannelName(
                      inputAuth.id,
                      session.Chat.characterId
                    ),
                    {
                      messageId: characterMessage.id,
                      textComplete: true,
                    } satisfies MessageUpdate
                  );

                  textDone.resolve();
                  break;
                }

                // End of all LLM responses.
                case 0x1d: {
                  stage = Stage.ConversationSummary;
                  break;
                }

                default: {
                  token += String.fromCharCode(byte);
                }
              }

              break;
            }

            case Stage.ConversationSummary: {
              if (byte == 0x1e) {
                console.debug("🤖 (sum)", conversationSummary);
                stage = Stage.ConversationBuffer;
              } else {
                conversationSummary += String.fromCharCode(byte);
              }

              break;
            }

            case Stage.ConversationBuffer: {
              if (byte == 0x04) {
                console.debug("🤖 (mem)", conversationBuffer);

                ee.emit(
                  onCharacterMessageUpdateChannelName(
                    inputAuth.id,
                    session.Chat.characterId
                  ),
                  {
                    messageId: characterMessage.id,
                    finalized: true,
                  } satisfies MessageUpdate
                );

                processingDone.resolve();
              } else {
                conversationBuffer += String.fromCharCode(byte);
              }

              break;
            }
          }
        }
      });

      process.stdin!.write(`${input.text}\n`);

      await textDone.promise;
      await prisma.characterMessage.update({
        where: {
          id: characterMessage.id,
        },
        data: {
          text,
        },
      });

      processingDone.promise.then(() => {
        process.stdout!.removeAllListeners("data");

        prisma.$transaction([
          prisma.characterMessage.update({
            where: {
              id: characterMessage.id,
            },
            data: {
              finalized: true,
            },
          }),
          prisma.chat.update({
            where: {
              id: session.Chat.id,
            },
            data: {
              // It does not print the summary unless the buffer is overflown.
              conversationSummary:
                conversationSummary.length > 0
                  ? conversationSummary
                  : undefined,

              conversationBuffer,
            },
          }),
        ]);
      });

      return {
        characterMessageId: characterMessage.id,
      };
    }),

  getRecentUserMessages: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({
          characterId: z.number().positive(),
        }),
      })
    )
    .query(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const chat = await prisma.chat.findUnique({
        where: {
          userId_characterId: {
            userId: inputAuth.id,
            characterId: input.chat.characterId,
          },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!chat || chat.userId !== inputAuth.id) {
        throw new Error("Chat not found");
      }

      return prisma.userMessage.findMany({
        select: {
          id: true,
          userId: true,
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

  getRecentCharacterMessages: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({ characterId: z.number().positive() }),
      })
    )
    .query(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const chat = await prisma.chat.findUnique({
        where: {
          userId_characterId: {
            userId: inputAuth.id,
            characterId: input.chat.characterId,
          },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!chat || chat.userId !== inputAuth.id) {
        throw new Error("Chat not found");
      }

      return prisma.characterMessage.findMany({
        select: {
          id: true,
          characterId: true,
          text: true,
          createdAt: true,
          finalized: true,
        },
        where: {
          chatId: chat.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  onUserMessage: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({
          characterId: z.number().positive(),
        }),
      })
    )
    .subscription(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const channelName = onUserMessageChannelName(
        inputAuth.id,
        input.chat.characterId
      );

      return observable<UserMessage>((emit) => {
        const onAdd = (data: UserMessage) => {
          emit.next(data);
        };

        ee.on(channelName, onAdd);

        return () => {
          ee.off(channelName, onAdd);
        };
      });
    }),

  onCharacterMessage: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({
          characterId: z.number().positive(),
        }),
      })
    )
    .subscription(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const channelName = onCharacterMessageChannelName(
        inputAuth.id,
        input.chat.characterId
      );

      return observable<CharacterMessage>((emit) => {
        const onAdd = (data: CharacterMessage) => {
          emit.next(data);
        };

        ee.on(channelName, onAdd);

        return () => {
          ee.off(channelName, onAdd);
        };
      });
    }),

  onCharacterMessageUpdate: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({ characterId: z.number().positive() }),
      })
    )
    .subscription(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const channelName = onCharacterMessageUpdateChannelName(
        inputAuth.id,
        input.chat.characterId
      );

      return observable<MessageUpdate>((emit) => {
        const onAdd = (data: MessageUpdate) => {
          emit.next(data);
        };

        ee.on(channelName, onAdd);

        return () => {
          ee.off(channelName, onAdd);
        };
      });
    }),
});
