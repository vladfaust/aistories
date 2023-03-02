import { z } from "zod";
import * as redis from "@/services/redis";
import { PrismaClient } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { protectedProcedure } from "@/trpc/middleware/auth";

const prisma = new PrismaClient();

/**
 * Subscribe to content tokens in a story.
 */
export default protectedProcedure
  .input(
    z.object({
      storyId: z.number().positive(),
    })
  )
  .subscription(async ({ ctx, input }) => {
    // Check that the user has access to the story.
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
      select: { userId: true },
    });

    if (!story || story.userId !== ctx.user.id) {
      throw new Error("Story not found");
    }

    const redisClient = redis.client();

    return observable<{
      contentId: number;
      token: string;
    }>((emit) => {
      redisClient.psubscribe(
        redis.prefix + `story:${input.storyId}:contentToken:*`,
        (err, count) => {
          if (err) throw err;
        }
      );

      redisClient.on(
        "pmessage",
        (pattern: string, channel: string, token: string) => {
          const split = channel.toString().split(":");
          const contentId = parseInt(split[split.length - 1]);
          emit.next({ contentId, token });
        }
      );

      return () => {
        redisClient.unsubscribe();
      };
    });
  });
