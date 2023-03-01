import * as pg from "@/services/pg";
import { observable } from "@trpc/server/observable";
import { protectedProcedure } from "@/trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Subscribe to energy changes (additions and subtractions).
 */
export default protectedProcedure.subscription(async ({ ctx }) => {
  return observable<number>((emit) => {
    const cancels = [
      pg.listen("Web3EnergyPurchaseInsert", async (payload: any) => {
        const purchase = JSON.parse(payload);

        const identity = await prisma.web3Identity.findUniqueOrThrow({
          where: { address: pg.byteaStringToBuffer(purchase.address) },
          select: { userId: true },
        });

        if (identity.userId != ctx.user.id) return;

        emit.next(+purchase.energy);
      }),

      pg.listen("StoryContentInsert", async (payload: any) => {
        const content = JSON.parse(payload) satisfies {
          userId: number;
          energyCost: number;
        };
        if (content.userId != ctx.user.id) return;
        emit.next(-content.energyCost);
      }),
    ];

    return () => {
      Promise.all(cancels).then((cancels) => cancels.forEach((c) => c()));
    };
  });
});
