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

class PromiseQueue {
  private queue: (() => Promise<any>)[] = [];
  private running = false;

  async run() {
    if (this.running) {
      return;
    }

    this.running = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();

      if (task) {
        await task();
      }
    }

    this.running = false;
  }

  add(task: () => Promise<any>) {
    this.queue.push(task);
    this.run();
  }
}

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
      ee.emit("chatMessage", userMessage);

      const charMessage = await prisma.textMessage.create({
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

      ee.emit("chatMessage", charMessage);

      const text = new Deferred<string>();
      let textBuffer = "";
      let sentence = "";
      const promisesQueue = new PromiseQueue();

      ai.process.stdout.on("data", async (data: Buffer) => {
        console.log("🤖 (raw)", data);

        if (data.equals(Buffer.from([0]))) {
          console.log("🤖 (end)", textBuffer);
          text.resolve(textBuffer);
          return;
        }

        const response = data.toString();
        sentence += response;

        if (!response.match(/[\.\?\!]/)) {
          return; // Not a sentence terminator
        }

        const theSentence = sentence;
        sentence = "";

        console.log("🤖", theSentence);
        textBuffer += theSentence;

        promisesQueue.add(async () => {
          const tts = await elevenLabs.tts(theSentence, "21m00Tcm4TlvDq8ikWAM");

          ee.emit("charMessageSentence", {
            messageId: charMessage.id,
            sentence: theSentence,
            tts,
          });
        });

        promisesQueue.run();
      });

      ai.process.stdin.write(`${input}\n`);
      await text.promise;

      await prisma.textMessage.update({
        where: {
          id: charMessage.id,
        },
        data: {
          text: textBuffer,
        },
      });

      return charMessage;
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

  onCharMessageSentence: publicProcedure.subscription(() => {
    return observable<{ messageId: number; sentence: string; tts?: string }>(
      (emit) => {
        const onAdd = (data: {
          messageId: number;
          sentence: string;
          tts?: ArrayBuffer;
        }) => {
          emit.next({
            ...data,
            tts: data.tts
              ? Buffer.from(data.tts).toString("base64")
              : undefined,
          });
        };

        ee.on("charMessageSentence", onAdd);

        return () => {
          ee.off("charMessageSentence", onAdd);
        };
      }
    );
  }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
