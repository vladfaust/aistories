import konsole from "@/services/konsole";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { encode } from "gpt-3-encoder";
import { TRPCError } from "@trpc/server";
import { advance as aiAdvance } from "@/ai/story";
import * as redis from "@/services/redis";
import { lock } from "./shared";
import { OpenAIError } from "@/services/openai";
import * as energy from "@/logic/energy";

const INPUT_TOKEN_LIMIT = 1024;

const prisma = new PrismaClient();

export function busyCh(storyId: string) {
  return redis.prefix + `story:${storyId}:busy`;
}

export function reasonCh(storyId: string) {
  return redis.prefix + `story:${storyId}:reason`;
}

async function setBusy(storyId: string, busy: boolean, ex?: number) {
  if (ex) {
    return redis.default.set(busyCh(storyId), busy ? "1" : "0", "EX", ex);
  } else {
    return redis.default.set(busyCh(storyId), busy ? "1" : "0");
  }
}

async function pubBusy(storyId: string, busy: boolean) {
  return redis.default.publish(busyCh(storyId), busy ? "1" : "0");
}

async function pubReason(storyId: string, reason?: string) {
  return redis.default.publish(reasonCh(storyId), reason || "");
}

export default protectedProcedure
  .input(
    z.object({
      storyId: z.string(),
      userMessage: z.string().optional(),
    })
  )
  .output(
    z.object({
      contentId: z.number(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const story = await prisma.story.findFirst({
      where: { id: input.storyId },
      select: { id: true, userId: true, userCharId: true },
    });

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
    }

    if (story.userId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not your story" });
    }

    if (
      input.userMessage &&
      encode(input.userMessage).length > INPUT_TOKEN_LIMIT
    ) {
      throw new TRPCError({
        code: "PAYLOAD_TOO_LARGE",
        message: "Message too long",
      });
    }

    const unlock = await lock(input.storyId);
    await pubBusy(input.storyId, true);

    let done = false;
    const redisUpdate = setInterval(() => {
      if (done) return;
      setBusy(input.storyId, true, 1);
    }, 500);

    try {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: ctx.user.id },
        select: {
          openAiApiKey: true,
          useOpenAiApiKey: true,
        },
      });

      if (user.useOpenAiApiKey) {
        if (!user.openAiApiKey) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "OpenAI API key is not set",
          });
        }
      } else {
        if ((await energy.getBalance(ctx.user.id)) < 1) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Not enough energy",
          });
        }
      }

      await prisma.$transaction(async (prisma) => {
        await prisma.story.update({
          where: { id: story.id },
          data: { reason: null },
        });

        if (input.userMessage) {
          await prisma.storyContent.create({
            data: {
              storyId: story.id,
              charId: story.userCharId,
              userId: ctx.user.id,
              content: input.userMessage,
              tokenUsage: 0,
              tokenLength: encode(input.userMessage).length,
            },
          });
        }
      });

      await pubReason(input.storyId); // Clear reason

      return {
        contentId: await aiAdvance(
          story.id,
          user.useOpenAiApiKey ? user.openAiApiKey! : undefined
        ),
      };
    } catch (e: any) {
      konsole.error(["story", "advance"], e);

      let reason = e.message;
      if (e instanceof OpenAIError) {
        reason = `OpenAI error (${e.status}): ${e.message}`;
      }

      await prisma.story.update({
        where: { id: story.id },
        data: { reason },
      });

      await pubReason(input.storyId, reason);

      throw e;
    } finally {
      await unlock();

      done = true;
      redisUpdate.unref();

      setBusy(input.storyId, false);
      pubBusy(input.storyId, false);
    }
  });
