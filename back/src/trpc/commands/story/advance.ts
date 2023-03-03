import konsole from "@/services/konsole";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/middleware/auth";
import { encode } from "gpt-3-encoder";
import { TRPCError } from "@trpc/server";
import * as pg from "@/services/pg";
import { XXH64 } from "xxh3-ts";
import { advance as aiAdvance } from "@/ai/story";
import * as redis from "@/services/redis";

const INPUT_TOKEN_LIMIT = 1024;

const prisma = new PrismaClient();

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

    const pgClient = await pg.pool.connect();
    const hash = XXH64(Buffer.from(story.id, "utf-8")) % 9223372036854775807n;

    const result = await pgClient.query(
      `SELECT pg_try_advisory_lock($1) AS locked`,
      [hash]
    );

    if (!result.rows[0].locked) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Story is busy",
      });
    }

    redis.default.publish(redis.prefix + `story:${input.storyId}:busy`, "1");

    const redisUpdate = setInterval(() => {
      redis.default.set(
        redis.prefix + `story:${input.storyId}:busy`,
        "1",
        "EX",
        1
      );
    }, 500);

    try {
      const openAiApiKey = (
        await prisma.user.findUniqueOrThrow({
          where: { id: ctx.user.id },
          select: { openAiApiKey: true },
        })
      ).openAiApiKey;

      if (!openAiApiKey) {
        await prisma.story.update({
          where: { id: story.id },
          data: { reason: "OpenAI API key is not set" },
        });

        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "OpenAI API key is not set",
        });
      }

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

      return {
        contentId: await aiAdvance(story.id, openAiApiKey),
      };
    } finally {
      await pgClient.query(`SELECT pg_advisory_unlock($1)`, [hash]);
      redisUpdate.unref();
      redis.default.publish(redis.prefix + `story:${input.storyId}:busy`, "0");
      pgClient.release();
    }
  });
