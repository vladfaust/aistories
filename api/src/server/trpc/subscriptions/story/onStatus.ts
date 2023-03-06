import { z } from "zod";
import { t } from "#trpc";
import * as redis from "@/services/redis";
import { PrismaClient } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { TRPCError } from "@trpc/server";
import { busyCh, reasonCh } from "#trpc/commands/story/advance";

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
      select: { reason: true },
    });

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
    }

    const redisClient = redis.client();

    return observable<{ busy?: boolean; reason?: string | null }>((emit) => {
      redisClient.subscribe(busyCh(input.storyId), (err, count) => {
        if (err) throw err;
      });

      redisClient.subscribe(reasonCh(input.storyId), (err, count) => {
        if (err) throw err;
      });

      redisClient.on("message", (channel: string, message: string) => {
        switch (channel) {
          case reasonCh(input.storyId):
            emit.next({ reason: message || null });
            break;
          case busyCh(input.storyId):
            emit.next({ busy: !!parseInt(message) });
            break;
        }
      });

      redis.default.get(busyCh(input.storyId), (err, res) => {
        if (err) throw err;
        emit.next({ busy: !!parseInt(res || ""), reason: story.reason });
      });

      return () => {
        redisClient.unsubscribe();
      };
    });
  });
