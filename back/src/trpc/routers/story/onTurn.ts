import { z } from "zod";
import { t } from "../../index";
import * as redis from "@/services/redis";
import { upsertUser } from "@/trpc/context";
import { PrismaClient } from "@prisma/client";
import { observable } from "@trpc/server/observable";

const prisma = new PrismaClient();

/**
 * Subscribe to turns in a story.
 * Immediately emits the current turn.
 */
export default t.procedure
  .input(
    z.object({
      authToken: z.string(),
      storyId: z.number().positive(),
    })
  )
  .subscription(async ({ input }) => {
    const inputAuth = await upsertUser(input.authToken);

    // Check that the user has access to the story.
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
      select: { userIds: true, nextCharId: true },
    });

    if (!story || !story.userIds.includes(inputAuth.id)) {
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
