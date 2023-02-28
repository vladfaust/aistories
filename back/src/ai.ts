import { PrismaClient } from "@prisma/client";
import config from "@/config";
import { chooseRandom, sleep, toBuffer } from "@/utils";
import * as redis from "@/services/redis";
import { encode } from "gpt-3-encoder";
import { OpenAI } from "langchain/llms";
import { Channel } from "@eyalsh/async_channels";
import * as health from "@/health";
import konsole from "./services/konsole";
import { assert } from "console";

const bufferHardLimit = 512;
const bufferSoftLimit = 256; // Would truncate to this limit when hard limit is reached
assert(bufferSoftLimit < bufferHardLimit);

const prisma = new PrismaClient();

/**
 * @yields Tokens
 */
async function* generateCharacterResponse({
  setup,
  characters,
  context,
  recentLines,
  currentCharacterName,
}: {
  setup: string | null;
  characters: { name: string; about: string; personality: string }[];
  context: string | null;
  recentLines: { name: string; content: string }[];
  currentCharacterName: string;
}): AsyncGenerator<Buffer> {
  const prompt = `
The following is a recording of a roleplaying chat game.

[RULES]
A message ALWAYS ends with a new line (\\n).
Player MAY skip their turn with a empty line.
Narration is ALWAYS wrapped in [], and ONLY in [].
Narration MUST end with ".", "!", or "?".
Narration MUST be in present tense, third-person, including the subject name.
Any other formatting is NOT allowed.

[[EXAMPLE]]
<Alisa>: [Alisa pumping her fist in enthusiasm.] You can do it, Lena! Yes!
<Lena>: [Lena grunts with determination, and after a few failed attempts she finally manages to ace that shot!]
<Alisa>: [Alisa looks excitedly at Semyon and jokingly points her finger at him.] Now we know who's running naked! [Alice and Lena laugh as they hug each other.]

${setup ? "[SETUP]\n" + setup + "\n" : ""}

[CHARACTERS]
${characters
  .map(
    (c) =>
      `[[${c.name}]]\n` +
      (c.name == currentCharacterName ? c.personality : c.about)
  )
  .join("\n")}

${context ? "[CONTEXT]\n" + context + "\n" : ""}

[RECORDING]
${recentLines
  .map((l) => `<${l.name}>: ` + l.content)
  .join("\n")}\n<${currentCharacterName}>:
`.trim();

  const tokenChannel = new Channel<Buffer>();
  let text = "";

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
    if (token.length === 0) continue;
    text += token.toString();
    yield token;
  }

  console.debug(prompt, text.trim());
}

/**
 * @returns The new summary
 */
async function summarize({
  setup,
  characterName,
  characters,
  oldSummary,
  newLines,
}: {
  setup: string | null;
  characterName: string;
  characters: { name: string; about: string; personality: string }[];
  oldSummary: string | null;
  newLines: { name: string; content: string }[];
}): Promise<string> {
  const prompt = `
Revise the summary for ${characterName}'s perspective, tailored to their personality and highlighting the key information relevant to their understanding of the story and relationships with other characters.
The summary should be concise, under 512 tokens, and omit any irrelevant details.
DO NOT include the setup or characters in the new summary.
ONLY include the story progression since the last summary revision.

[GAME RULES]
A message ALWAYS ends with a new line (\\n).
Player MAY skip their turn with a empty line.
Third-person narration is ALWAYS wrapped in [], and ONLY in [].

${setup ? "[SETUP]\n" + setup + "\n" : ""}

[CHARACTERS]
${characters
  .map(
    (c) =>
      `[[${c.name}]]\n` + (c.name == characterName ? c.personality : c.about)
  )
  .join("\n")}

${oldSummary ? "[OLD SUMMARY]\n" + oldSummary + "\n" : ""}

[NEW LINES]
${newLines.map((l) => `<${l.name}>: ` + l.content).join("\n")}

[NEW SUMMARY]
  `.trim();

  const openai = new OpenAI({
    maxTokens: 512,
    temperature: 0.9,
  });

  const response = await openai.generate([prompt]);
  const text = response.generations[0][0].text.trim();
  console.debug("Summary generated", prompt, text);
  return text;
}

export function loop() {
  mainLoop();
  livenessCheckLoop();
}

async function mainLoop() {
  while (true) {
    const busyStory = await prisma.story.findFirst({
      where: {
        busy: true,
        pid: null,
      },
      select: {
        id: true,
      },
    });

    if (busyStory) {
      const story = await prisma.$transaction(async (prisma) => {
        const s = await prisma.story.findFirst({
          where: {
            id: busyStory.id,
            busy: true,
            pid: null,
          },
          select: {
            id: true,
            userIds: true,
            userMap: true,
            charIds: true,
            nextCharId: true,
            setup: true,
            fabula: true,
            buffer: true,
          },
        });

        if (!s) return false; // Someone else got the lock

        await prisma.story.update({
          where: { id: busyStory.id },
          data: { pid: config.pid },
        });

        return s;
      });

      if (!story) continue;

      konsole.log(["ai", "mainLoop"], "Processing story", story.id);

      // Get the latest content of the story.
      let latestContent = await prisma.storyContent.findFirst({
        where: {
          storyId: story.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          charId: true,
          content: true,
        },
      });

      if (latestContent?.charId !== story.nextCharId) {
        // If the latest content is not from the next actor,
        // create a new empty content.
        //

        latestContent = await prisma.storyContent.create({
          data: {
            storyId: story.id,
            charId: story.nextCharId,
            energyCost: 0,
          },
          select: {
            id: true,
            charId: true,
            content: true,
          },
        });
      }

      if (!latestContent.content) {
        // If the latest content is empty, generate it.
        //

        const [characters, contentBuffer, memory] = await Promise.all([
          prisma.character.findMany({
            where: {
              id: {
                in: story.charIds,
              },
            },
            select: {
              id: true,
              name: true,
              about: true,
              personality: true,
            },
          }),
          prisma.storyContent.findMany({
            where: {
              id: {
                in: story.buffer,
              },
            },
            select: {
              charId: true,
              content: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          }),
          prisma.storyMemory.findUnique({
            where: {
              storyId_charId: {
                storyId: story.id,
                charId: latestContent.charId,
              },
            },
            select: {
              memory: true,
              checkpoint: true,
            },
          }),
        ]);

        const pubChannel =
          redis.prefix + `story:${story.id}:contentToken:${latestContent.id}`;
        let generatedline = "";
        for await (const token of generateCharacterResponse({
          setup: story.setup,
          characters,
          context: memory?.memory || story.fabula || null,
          currentCharacterName: characters.find(
            (char) => char.id === latestContent!.charId
          )!.name,
          recentLines: contentBuffer.map((content) => ({
            name: characters.find((char) => char.id === content.charId)!.name,
            content: content.content!,
          })),
        })) {
          await redis.default.publish(pubChannel, token);
          generatedline += token.toString();
        }
        generatedline = generatedline.trim();
        await redis.default.publish(pubChannel, "\n");

        // If the new buffer exceeds the limit, split the buffer into two parts:
        // one to summarize (on the left), and one to keep (on the right).
        //

        contentBuffer.push({
          charId: latestContent.charId,
          content: generatedline,
        });

        story.buffer.push(latestContent.id);

        let bufferTokenLength = 0;
        let softLimitReachedAt: number | null = null;
        let hardLimitReachedAt: number | null = null;
        let linesToSummarize: { name: string; content: string }[] = [];

        for (let i = contentBuffer.length - 1; i >= 0; i--) {
          bufferTokenLength += encode(contentBuffer[i].content!).length;

          if (
            softLimitReachedAt === null &&
            bufferTokenLength >= bufferSoftLimit
          ) {
            softLimitReachedAt = i;
          }

          if (bufferTokenLength >= bufferHardLimit) {
            hardLimitReachedAt = i;
            softLimitReachedAt = softLimitReachedAt!;

            // The part to summarize.
            linesToSummarize = contentBuffer
              .slice(0, softLimitReachedAt + 1)
              .map((c) => ({
                name: characters.find((char) => char.id === c.charId)!.name,
                content: c.content!,
              }));

            // The part to keep.
            story.buffer = story.buffer.slice(softLimitReachedAt);

            break;
          }
        }

        const userMap = JSON.parse(story.userMap) as Record<number, number>;

        if (linesToSummarize.length > 0) {
          console.debug("Would summarize", {
            bufferTokenLength,
            softLimitReachedAt,
            hardLimitReachedAt,
          });

          // For all non-user characters, update their memories.
          await Promise.all(
            characters
              .filter((c) => !Object.values(userMap).includes(c.id))
              .map(async (char) => {
                const previousMemory = await prisma.storyMemory.findUnique({
                  where: {
                    storyId_charId: {
                      storyId: story.id,
                      charId: char.id,
                    },
                  },
                  select: {
                    memory: true,
                    checkpoint: true,
                  },
                });

                // If the memory is already up-to-date, skip.
                if (previousMemory?.checkpoint == latestContent!.id) return;

                const newMemory = await summarize({
                  setup: story.setup,
                  characterName: char.name,
                  characters,
                  oldSummary: previousMemory?.memory || story.fabula || null,
                  newLines: linesToSummarize,
                });

                await prisma.storyMemory.upsert({
                  where: {
                    storyId_charId: {
                      storyId: story.id,
                      charId: char.id,
                    },
                  },
                  create: {
                    storyId: story.id,
                    charId: char.id,
                    memory: newMemory,
                    checkpoint: latestContent!.id,
                  },
                  update: {
                    memory: newMemory,
                    checkpoint: latestContent!.id,
                  },
                });
              })
          );
        }

        const nextCharId = chooseRandom(
          story.charIds.filter((id) => id !== latestContent!.charId)
        );

        await prisma.$transaction([
          prisma.story.update({
            where: {
              id: story.id,
            },
            data: {
              nextCharId,

              // If the next actor is a character, mark the story as busy.
              busy: !Object.values(userMap).includes(nextCharId),

              pid: null,
              buffer: story.buffer,
            },
          }),

          prisma.storyContent.update({
            where: {
              id: latestContent.id,
            },
            data: {
              content: generatedline,
              energyCost: 1,
            },
          }),
        ]);

        await redis.default.publish(
          redis.prefix + `story:${story.id}:turn`,
          nextCharId.toString()
        );
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
