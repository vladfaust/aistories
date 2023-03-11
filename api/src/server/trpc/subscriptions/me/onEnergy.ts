import * as pg from "@/services/pg";
import { PrismaClient } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { protectedProcedure } from "../../middleware/auth";

const prisma = new PrismaClient();

/**
 * OPTIMIZE: Cache this in Redis.
 */
async function getStoryOwner(storyId: string): Promise<string> {
  const story = await prisma.story.findUniqueOrThrow({
    where: { id: storyId },
    select: { userId: true },
  });

  return story.userId;
}

/**
 * Subscribe to further energy updates, yielding deltas.
 */
export default protectedProcedure.subscription(async ({ ctx }) => {
  return observable<{
    reason: "web3Purchase" | "storyContent" | "grant";
    delta: number;
    createdAt: Date;
  }>((emit) => {
    const cancels = [
      pg.listen("Web3EnergyPurchaseInsert", async (payload: any) => {
        const message: {
          userId: string;
          amount: number;
          createdAt: string; // Timestamp
        } = JSON.parse(payload);

        if (message.userId != ctx.user.id) return;

        emit.next({
          reason: "web3Purchase",
          delta: message.amount,
          createdAt: new Date(Date.parse(message.createdAt)),
        });
      }),

      pg.listen("StoryContentInsert", async (payload: any) => {
        const message: {
          storyId: string;
          energyUsage?: number;
          createdAt: string; // Timestamp
        } = JSON.parse(payload);

        if (!message.energyUsage) return;
        if ((await getStoryOwner(message.storyId)) != ctx.user.id) return;

        emit.next({
          reason: "storyContent",
          delta: -message.energyUsage,
          createdAt: new Date(Date.parse(message.createdAt)),
        });
      }),

      pg.listen("EnergyGrantInsert", async (payload: any) => {
        const message: {
          userId: string;
          amount: number;
          createdAt: string; // Timestamp
        } = JSON.parse(payload);

        if (message.userId != ctx.user.id) return;

        emit.next({
          reason: "grant",
          delta: message.amount,
          createdAt: new Date(Date.parse(message.createdAt)),
        });
      }),
    ];

    return () => {
      Promise.all(cancels).then((cancels) => cancels.map((cancel) => cancel()));
    };
  });
});
