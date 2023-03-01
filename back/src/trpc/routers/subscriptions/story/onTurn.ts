import { z } from "zod";
import * as redis from "@/services/redis";
import { PrismaClient } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { protectedProcedure } from "@/trpc/middleware/auth";

const prisma = new PrismaClient();

/**
 * Subscribe to turns in a story.
 * Immediately emits the current turn.
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
      select: { userIds: true, nextCharId: true },
    });

    if (!story || !story.userIds.includes(ctx.user.id)) {
      throw new Error("Story not found");
    }

    const redisClient = redis.client();

    return observable<{ nextCharId: number }>((emit) => {
      redisClient.subscribe(
        redis.prefix + `story:${input.storyId}:turn`,
        (err, count) => {
          if (err) throw err;
        }
      );

      redisClient.on("message", (channel: string, message: string) => {
        emit.next({ nextCharId: parseInt(message) });
      });

      emit.next({ nextCharId: story.nextCharId });

      return () => {
        redisClient.unsubscribe();
      };
    });
  });
