import { PrismaClient } from "@prisma/client";
import config from "@/config";
import { sleep, toBuffer } from "@/utils";
import * as redis from "@/services/redis";
import { encode } from "gpt-3-encoder";
import { OpenAI } from "langchain/llms";
import { Channel } from "@eyalsh/async_channels";
import * as health from "@/health";
import konsole from "./services/konsole";

const bufferTokenLimit = 100;

const prisma = new PrismaClient();

const PROMPT = `
This is partial recording of a roleplaying chat game between HUMAN and AI.
Third-person narration is in <>; other than that, no other formatting is allowed.
No newlines are allowed.

AI PERSONALITY:
{{personality}}

PREVIOUS SUMMARY:
{{summary}}

RECORDING:
`.trim();

const SUMMARIZATION_PROMPT = `
This is a summary of recording of a roleplaying chat game between HUMAN and AI.
It is not a summary of the entire game, but rather a summary of what AI finds important to remember in accordance with its personality.
Third-person narration is in <>; other than that, no other formatting is allowed.
No newlines are allowed.

AI PERSONALITY:
{{personality}}

PREVIOUS SUMMARY:
{{summary}}

NEW LINES:
{{newLines}}

NEW SUMMARY:
`.trim();

/**
 *
 * @param fabula The initial story fabula
 * @param personality The character personality
 * @param summary The cuurent story summary
 * @param recentLines The story recent lines
 *
 * @yields Tokens
 */
async function* generateCharacterResponse(
  fabula: string | null,
  personality: string,
  summary: string | null,
  recentLines: string[],
  input: string
): AsyncGenerator<Buffer> {
  const prompt =
    PROMPT.replace("{{personality}}", personality).replace(
      "{{summary}}",
      summary || fabula || ""
    ) +
    "\n" +
    recentLines.join("\n") +
    "\n" +
    input +
    "\nAI:";

  console.debug(prompt);

  const tokenChannel = new Channel<Buffer>();

  const openai = new OpenAI({
    streaming: true,
    maxTokens: 256,
    temperature: 1.1,
    callbackManager: {
      handleNewToken: (token: string) => {
        tokenChannel.send(Buffer.from(token));
      },
      handleEnd: async (output) => {
        await sleep(200); // Wait for the last token to be sent
        tokenChannel.close();
      },
    },
  });

  openai.generate([prompt], ["\n"]);

  for await (const token of tokenChannel) {
    yield token;
  }
}

/**
 *
 * @param fabula The story fabula
 * @param personality The character personality
 * @param summary The existing story summary
 * @param newLines New lines to include in the summary
 * @returns The new summary
 */
async function summarize(
  fabula: string | null,
  personality: string,
  summary: string | null,
  newLines: string[]
): Promise<string> {
  const prompt = SUMMARIZATION_PROMPT.replace("{{personality}}", personality)
    .replace("{{summary}}", summary || fabula || "")
    .replace("{{newLines}}", newLines.join("\n"));

  console.debug(prompt);

  const openai = new OpenAI({
    maxTokens: 512,
    temperature: 0.9,
  });

  const response = await openai.generate([prompt]);

  return response.generations[0][0].text.trim();
}

export function loop() {
  mainLoop();
  livenessCheckLoop();
}

async function mainLoop() {
  while (true) {
    let story = await prisma.story.findFirst({
      where: {
        busy: true,
        pid: null,
      },
      select: {
        id: true,
        characterId: true,
        fabula: true,
        summary: true,
        buffer: true,
      },
    });

    if (story) {
      const lock = await prisma.$transaction(async (prisma) => {
        story = await prisma.story.findFirst({
          where: {
            id: story!.id,
            busy: true,
            pid: null,
          },
          select: {
            id: true,
            characterId: true,
            fabula: true,
            summary: true,
            buffer: true,
          },
        });

        if (!story) return false;

        await prisma.story.update({
          where: {
            id: story.id,
          },
          data: {
            pid: config.pid,
          },
        });

        return true;
      });

      if (!lock) continue;

      konsole.log(["ai", "mainLoop"], "Processing story", story.id);

      // Get the latest message, be it user or character message,
      // selected by the latest createdAt timestamp.
      let [latestUserMessage, latestCharacterMessage] = await Promise.all([
        prisma.userMessage.findFirst({
          where: {
            storyId: story.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            userId: true,
            createdAt: true,
            content: true,
          },
        }),
        prisma.characterMessage.findFirst({
          where: {
            storyId: story.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            characterId: true,
            createdAt: true,
            content: true,
          },
        }),
      ]);

      let latestMessage = latestUserMessage
        ? latestCharacterMessage
          ? latestUserMessage.createdAt > latestCharacterMessage.createdAt
            ? latestUserMessage
            : latestCharacterMessage
          : latestUserMessage
        : latestCharacterMessage;

      if (!latestMessage) {
        throw "Unexpected: no latest message found";
      }

      if ("userId" in latestMessage) {
        // User message is the latest message,
        // create a character message in response.
        latestMessage = latestCharacterMessage =
          await prisma.characterMessage.create({
            data: {
              storyId: story.id,
              characterId: story.characterId,
            },
            select: {
              id: true,
              characterId: true,
              createdAt: true,
              content: true,
            },
          });
      }

      if (!latestMessage.content) {
        // If the latest character message is empty, generate a response.
        //

        let [character, userMessagesBuffer, charMessageBuffer] =
          await Promise.all([
            prisma.character.findFirstOrThrow({
              where: {
                id: latestCharacterMessage!.characterId,
              },
              select: {
                id: true,
                name: true,
                personality: true,
              },
            }),
            prisma.userMessage.findMany({
              where: {
                storyId: story.id,
                id: {
                  // Negative IDs are used to indicate user messages.
                  in: story.buffer.filter((id) => id < 0).map((id) => -id),
                },
              },
              select: {
                userId: true,
                content: true,
                createdAt: true,
              },
            }),
            prisma.characterMessage.findMany({
              where: {
                storyId: story.id,
                id: {
                  in: story.buffer,
                },
              },
              select: {
                characterId: true,
                content: true,
                createdAt: true,
              },
            }),
          ]);

        let stringBuffer = [...userMessagesBuffer, ...charMessageBuffer]
          .sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf())
          .map((message) =>
            "userId" in message
              ? `HUMAN: ${message.content}`
              : `AI: ${message.content}`
          );

        const input = `HUMAN: ${latestUserMessage!.content}`;
        const pubChannel =
          redis.prefix + `story:${story.id}:messageToken:${latestMessage.id}`;

        let generatedline = "";
        for await (const token of generateCharacterResponse(
          story.fabula,
          character.personality,
          story.summary,
          stringBuffer,
          input
        )) {
          await redis.default.publish(pubChannel, token);
          generatedline += token.toString();
        }
        await redis.default.publish(pubChannel, "\n");

        console.debug(generatedline);

        // Update the buffer with the new messages.
        stringBuffer.push(input);
        stringBuffer.push("AI: " + generatedline);

        if (latestUserMessage) story.buffer.push(-latestUserMessage.id);
        story.buffer.push(latestCharacterMessage!.id);

        // If the new buffer exceeds the limit, split the buffer into two parts:
        // one to summarize (on the left), and one to keep (on the right).
        let bufferTokenLength = 0;
        let toSummarize: string[] = [];
        for (let i = stringBuffer.length - 1; i >= 0; i--) {
          bufferTokenLength += encode(stringBuffer[i]).length;
          if (bufferTokenLength > bufferTokenLimit) {
            toSummarize = stringBuffer.slice(0, i + 1); // The part to summarize.
            stringBuffer = stringBuffer.slice(i + 1); // The part to keep.
            story.buffer = story.buffer.slice(i + 1); // The part to keep.
            break;
          }
        }

        if (toSummarize.length > 0) {
          console.debug("Would summarize", {
            summary: story.summary,
            toSummarize,
          });

          story.summary = await summarize(
            story.fabula,
            character.personality,
            story.summary,
            toSummarize
          );

          console.debug(story.summary);
        }

        await prisma.$transaction([
          prisma.story.update({
            where: {
              id: story.id,
            },
            data: {
              busy: false,
              pid: null,
              buffer: story.buffer,
              summary: story.summary,
            },
          }),

          prisma.characterMessage.update({
            where: {
              id: latestCharacterMessage!.id,
            },
            data: {
              content: generatedline,
            },
          }),
        ]);
      } else {
        throw "Unexpected: latest message has no content";
      }
    } else {
      await sleep(250);
    }
  }
}

async function livenessCheckLoop() {
  while (true) {
    const startTime = process.hrtime.bigint();

    const busyStories = await prisma.story.findMany({
      where: {
        busy: true,
        pid: {
          not: null,
        },
      },
    });

    for (const story of busyStories) {
      const pid = story.pid!;

      if (!(await health.check(pid))) {
        konsole.warn(["ai", "liveness"], `Process is dead`, { pid });

        await prisma.$transaction(async (prisma) => {
          const story = await prisma.story.findFirst({
            where: {
              pid,
              busy: true,
            },
          });

          if (story) {
            await prisma.story.update({
              where: {
                id: story.id,
              },
              data: {
                busy: true,
                pid: null,
              },
            });
          } else {
            return; // The story was already updated by another process.
          }
        });
      }
    }

    const endTime = process.hrtime.bigint();

    const sleepTime = Math.max(
      0,
      health.INTERVAL / 2 - Number(endTime - startTime) / 1e6
    );

    await sleep(sleepTime);
  }
}
