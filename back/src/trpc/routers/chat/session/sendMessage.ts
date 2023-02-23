import { z } from "zod";
import { t } from "@/trpc/index";
import * as ai from "@/ai.js";
import { Deferred, sleep } from "@/utils.js";
import { PrismaClient } from "@prisma/client";
import { upsertUser } from "@/trpc/context";
import * as chat from "../../chat";

const prisma = new PrismaClient();

export default t.procedure
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

    const process = ai.processes[session.pid];
    if (!process || process.exitCode) {
      throw new Error("Process not found, re-initialize session");
    }

    if (latestCharacterMessage && !latestCharacterMessage.text) {
      if (latestCharacterMessage.pid != session.pid) {
        console.warn(
          "Last message was not finalized, but its pid has changed",
          {
            sessionId: input.sessionId,
            messageId: latestCharacterMessage.id,
          }
        );
      } else {
        throw new Error(
          "Cannot send message until previous message is finalized"
        );
      }
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

    chat.ee.emit(
      chat.onUserMessageChannelName(inputAuth.id, session.Chat.characterId),
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

    chat.ee.emit(
      chat.onCharacterMessageChannelName(
        inputAuth.id,
        session.Chat.characterId
      ),
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

                chat.ee.emit(
                  chat.onCharacterMessageUpdateChannelName(
                    inputAuth.id,
                    session.Chat.characterId
                  ),
                  {
                    messageId: characterMessage.id,
                    token,
                  } satisfies chat.MessageUpdate
                );

                text += token;
                token = "";

                break;
              }

              // End of a token stream.
              case 0x03: {
                console.log("🤖 (say)", text);

                chat.ee.emit(
                  chat.onCharacterMessageUpdateChannelName(
                    inputAuth.id,
                    session.Chat.characterId
                  ),
                  {
                    messageId: characterMessage.id,
                    textComplete: true,
                  } satisfies chat.MessageUpdate
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

              chat.ee.emit(
                chat.onCharacterMessageUpdateChannelName(
                  inputAuth.id,
                  session.Chat.characterId
                ),
                {
                  messageId: characterMessage.id,
                  finalized: true,
                } satisfies chat.MessageUpdate
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
              conversationSummary.length > 0 ? conversationSummary : undefined,

            conversationBuffer,
          },
        }),
      ]);
    });

    return {
      characterMessageId: characterMessage.id,
    };
  });
