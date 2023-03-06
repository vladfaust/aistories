import { PrismaClient } from "@prisma/client";
import { ChatCompletionRequestMessage } from "openai";
import * as openai from "@/services/openai";
import konsole from "@/services/konsole";
import { encode } from "gpt-3-encoder";
import { assert } from "console";
import pRetry from "p-retry";

const SOFT_BUFFER_LIMIT = 384;
const HARD_BUFFER_LIMIT = 768;
assert(SOFT_BUFFER_LIMIT < HARD_BUFFER_LIMIT);

function time(date: Date) {
  return date.toISOString();
}

const prisma = new PrismaClient();

/**
 * The story is guaranteed to be locked.
 * @returns The ID of the content that was added.
 */
export async function advance(
  storyId: string,
  openAiApiKey: string
): Promise<number> {
  const story = await prisma.story.findFirstOrThrow({
    where: { id: storyId },
    select: {
      Collection: {
        select: {
          setup: true,
        },
      },
      Owner: { select: { id: true } },
      userCharId: true,
      charIds: true,
      fabula: true,
      summary: true,
      checkpoint: true,
    },
  });

  const [characters, contents] = await Promise.all([
    prisma.character.findMany({
      where: { id: { in: [0, ...story.charIds] } },
      select: {
        id: true,
        name: true,
        personality: true,
      },
    }),
    prisma.storyContent.findMany({
      where: {
        storyId,
        id: { gt: story.checkpoint || 0 },
      },
      select: {
        charId: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        id: "asc",
      },
    }),
  ]);

  const mainCharacter = characters.find((c) => c.id === story.userCharId)!;

  const messages: ChatCompletionRequestMessage[] = [];

  messages.push({
    role: "system",
    content: `
The following is a turn-based roleplaying chat game.
`.trim(),
  });

  if (story.Collection.setup) {
    messages.push({
      role: "system",
      content: `Initial setup of the story:\n${story.Collection.setup}`.trim(),
    });
  }

  for (const char of characters) {
    messages.push({
      role: "system",
      content: `Character sheet for <${char.name}>: ${char.personality}`.trim(),
    });
  }

  if (story.summary || story.fabula) {
    messages.push({
      role: "system",
      content: `Summary of the previous events: ${
        story.summary || story.fabula
      }`.trim(),
    });
  }

  if (contents.length > 0) {
    for (const { charId, content, createdAt } of contents) {
      if (charId === 0) {
        messages.push({
          role: "assistant",
          content,
        });
      } else {
        messages.push({
          role: "user",
          name: characters
            .find((c) => c.id === charId)!
            .name.replace(/\s+/g, "_"),
          content: `(${time(createdAt)}) ${content}`,
        });
      }
    }
  } else {
    messages.push({
      role: "system",
      content: `The AI has to start the game.`,
    });
  }

  let possibleChars = characters.filter(
    (c) => c.id !== story.userCharId && c.id !== 0
  );

  messages.push({
    role: "system",
    content: `${
      possibleChars.length > 1
        ? `Respond with a SINGLE message as if you are one of the following characters: [${possibleChars
            .map((c) => `<${c.name}>`)
            .join(", ")}], choosing the most appropriate for the situation.`
        : `Respond with a SINGLE message as if you are <${possibleChars[0].name}>.`
    } If the character has nothing to say, respond with a narration.
AVOID REPETITION.

<${
      mainCharacter.name
    }> is the main character of the story, so keep the story focused on them.
If a character is currently inaccessible from the <${
      mainCharacter.name
    }>'s point of view, do NOT chose them.

Characters are aware of time.
Current time is ${time(new Date())}.

Keep the story engaging, consistent, coherent, life-like and immersive with details.
Include characters' interests, desires, and goals.
Give freedom to characters' fantasies and imagination.
Develop the story if the main character is struggling to find a way to continue.
SURPRISE THE AUDIENCE.
Give freedom to chacacters' emotions.
If a character has strong will, let them act on it.
You may hyperbolize the story, but keep it believable.
Explicit content is allowed, but keep it tasteful and relevant to the story.

Respond with a single message from a single character.
Start the message with the character's name in angle brackets, followed by a colon and a space.
Narrations are wrapped in [], and ONLY in [].
Any other formatting is NOT allowed.
The message MUST NOT contain newlines NOR timestamps NOR quotes ("").
Keep the message fairly short (under 256 tokens).

Example messages would be:

<John>: Hello! [John waves.] How are you?
<Mary Jane>: [Mary welcomes John.] I'm fine, thanks. How are you?
<John>: I'm fine, thanks. [John looks at Mary with joy.] What are you doing here?
<Mary Jane>: [Mary looks at John with a blank expression.]
[John also looks at Mary with a blank expression.]
`,
  });

  console.debug(messages);

  const chatCompletion = await pRetry(
    () =>
      openai.createChatCompletion(openAiApiKey, story.Owner.id, messages, 256, {
        temperature: 1.075,
        presencePenalty: 1,
        frequencyPenalty: 1,
      }),
    {
      retries: 5,
    }
  );

  console.debug(chatCompletion, chatCompletion.choices[0]?.message);

  const chatCompletionMessage = chatCompletion.choices[0]?.message;
  if (!chatCompletionMessage) {
    throw new Error("No message in response from OpenAI");
  }

  if (chatCompletionMessage.role !== "assistant") {
    throw new Error("Unexpected non-assistant response from OpenAI");
  }

  let [, name, text] =
    chatCompletionMessage.content.match(/^<([^>]+)>:(.*)/) || [];

  let respondedChar;

  if (name && text) {
    respondedChar = characters.find((c) => c.name === name);

    if (!respondedChar) {
      respondedChar = characters.find((c) => c.id === 0)!;
    }
  } else {
    respondedChar = characters.find((c) => c.id === 0)!;
    text = chatCompletionMessage.content;
  }

  const textTokenLength = encode(text).length;

  konsole.log(["ai", "story", "advance"], "Generated response", {
    name: respondedChar.name,
    text,
    textTokenLength,
  });

  const newBufferTokenLength =
    ((
      await prisma.storyContent.aggregate({
        where: {
          storyId,
          id: { gt: story.checkpoint || 0 },
        },
        _sum: { tokenLength: true },
      })
    )._sum.tokenLength || 0) + textTokenLength;

  console.debug({ newBufferTokenLength });
  if (newBufferTokenLength > HARD_BUFFER_LIMIT) {
    const buffer = await prisma.storyContent.findMany({
      where: {
        AND: [{ storyId }, { id: { gt: story.checkpoint || 0 } }],
      },
      select: {
        id: true,
        tokenLength: true,
        content: true,
        createdAt: true,
        Character: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    // Cut the buffer up to the soft limit.
    let summarizeUpToIndex = buffer.length - 1;
    let tokenLength = 0;
    for (; summarizeUpToIndex >= 0; summarizeUpToIndex--) {
      tokenLength += buffer[summarizeUpToIndex].tokenLength;
      if (tokenLength >= SOFT_BUFFER_LIMIT) break;
    }

    console.debug({ summarizeUpToIndex });

    if (summarizeUpToIndex >= 0) {
      story.checkpoint = buffer[summarizeUpToIndex].id;
      console.debug({ checkpoint: story.checkpoint });

      const toSummarize = buffer.slice(0, summarizeUpToIndex - 1);

      const prompt = `
Revise the summary for a roleplaying chat game, highlighting the information relevant to the story progression and relationships between characters.

DO NOT include the story setup, characters' personalities and relationships from the [CHARACTERS] section: it's a well-known information.
ONLY include the story progression since the previous revision.

The summary should be concise (under 1024 tokens), coherent, and omit any irrelevant details.
Characters are aware of time, and the time is a crucial part of the summary.

Make special effort to highlight the current story progression and relationships between characters happening in the new messages.
Pay attention to details which could be important later.
Pay special attention to the main character, <${mainCharacter.name}>.

A message ends with a newline.
Narrations in messages are wrapped in [].

${story.Collection.setup ? "[SETUP]\n" + story.Collection.setup + "\n" : ""}
[CHARACTERS]
${characters.map((c) => `[[${c.name}]]\n` + c.personality).join("\n\n")}

${
  story.summary || story.fabula
    ? "[OLD SUMMARY]\n" + (story.summary || story.fabula) + "\n"
    : ""
}
[NEW LINES]
${toSummarize
  .map((s) => `<${s.Character.name}> (${time(s.createdAt)}): ` + s.content)
  .join("\n")}
[NEW SUMMARY]
`;

      console.debug(prompt);
      const completion = await pRetry(
        () =>
          openai.createCompletion(openAiApiKey, story.Owner.id, prompt, 512),
        {
          retries: 5,
        }
      );
      console.debug(completion);

      story.summary = completion.choices[0]?.text!;
      if (!story.summary) {
        throw new Error("No text in response from OpenAI");
      }

      konsole.log(["ai", "story", "advance"], "New summary: ", story.summary);
    }
  }

  const [content] = await prisma.$transaction([
    prisma.storyContent.create({
      data: {
        storyId,
        charId: respondedChar.id,
        content: text,
        tokenLength: textTokenLength,
        tokenUsage: chatCompletion.usage!.total_tokens,
      },
      select: { id: true },
    }),
    prisma.story.update({
      where: { id: storyId },
      data: {
        checkpoint: story.checkpoint,
        summary: story.summary,
      },
    }),
  ]);

  return content.id;
}
