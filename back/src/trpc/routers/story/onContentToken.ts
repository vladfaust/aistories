import { z } from "zod";
import { t } from "../../index";
import * as redis from "@/services/redis";
import { upsertUser } from "@/trpc/context";
import { PrismaClient } from "@prisma/client";
import { observable } from "@trpc/server/observable";

const prisma = new PrismaClient();

/**
 * Subscribe to character message parts in a story.
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
      select: { userIds: true },
    });

    if (!story || !story.userIds.includes(inputAuth.id)) {
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
