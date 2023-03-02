import { z } from "zod";
import { t } from "@/trpc/index";
import * as redis from "@/services/redis";
import { PrismaClient } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();

/**
 * Subscribe to turns in a story.
 * Immediately emits the current turn.
 */
export default t.procedure
  .input(z.object({ storyId: z.string() }))
  .subscription(async ({ input }) => {
    // Check that the user has access to the story.
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
      select: { userId: true, nextCharId: true },
    });

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
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
