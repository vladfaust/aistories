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
      where: {
        id: input.storyId,
      },
      select: {
        userId: true,
      },
    });

    if (!story || story.userId !== inputAuth.id) {
      throw new Error("Story not found.");
    }

    const redisClient = redis.client();

    return observable<{
      messageId: number;
      token: string;
    }>((emit) => {
      redisClient.psubscribe(
        redis.prefix + `story:${input.storyId}:messageToken:*`,
        (err, count) => {
          if (err) {
            throw err;
          }
        }
      );

      redisClient.on(
        "pmessage",
        (pattern: string, channel: string, message: string) => {
          const split = channel.toString().split(":");
          const messageId = parseInt(split[split.length - 1]);
          emit.next({ messageId, token: message });
        }
      );

      return () => {
        redisClient.unsubscribe();
      };
    });
  });
