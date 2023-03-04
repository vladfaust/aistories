import { z } from "zod";
import { t } from "#trpc";
import * as redis from "@/services/redis";
import { PrismaClient } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();

/**
 * Subscribe to the story business status.
 * Immediately emits the current status.
 */
export default t.procedure
  .input(z.object({ storyId: z.string() }))
  .subscription(async ({ input }) => {
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
    });

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
    }

    const redisClient = redis.client();

    return observable<{ busy: boolean }>((emit) => {
      redisClient.subscribe(
        redis.prefix + `story:${input.storyId}:busy`,
        (err, count) => {
          if (err) throw err;
        }
      );

      redisClient.on("message", (channel: string, message: string) => {
        emit.next({ busy: !!parseInt(message) });
      });

      redis.default.get(
        redis.prefix + `story:${input.storyId}:busy`,
        (err, res) => {
          if (err) throw err;
          emit.next({ busy: !!parseInt(res || "") });
        }
      );

      return () => {
        redisClient.unsubscribe();
      };
    });
  });
