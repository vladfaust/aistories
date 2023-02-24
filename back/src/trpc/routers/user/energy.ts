import { t } from "../../../trpc/index";
import { PrismaClient } from "@prisma/client";
import z from "zod";
import { upsertUser } from "../../context";
import * as pg from "@/services/pg";
import { observable } from "@trpc/server/observable";

const prisma = new PrismaClient();

/**
 * @returns Cancel function
 */
async function pgListen(
  notificationChannel: string,
  onPayload: (payload: any) => void
): Promise<() => void> {
  const client = await pg.pool.connect();

  client.on("notification", async (msg: any) => {
    if (msg.channel == notificationChannel) {
      onPayload(msg.payload);
    }
  });

  client.query(`LISTEN "${notificationChannel}"`);

  return () => {
    client.query(`UNLISTEN "${notificationChannel}"`);
    client.release();
  };
}

export async function getEnergyBalance(userId: number, prismaClient = prisma) {
  const [purchases, spendings] = await Promise.all([
    prismaClient.onChainEnergyPurchase.aggregate({
      where: {
        userId,
      },
      _sum: {
        energy: true,
      },
    }),

    prismaClient.userMessage.aggregate({
      where: {
        userId,
      },
      _sum: {
        energyCost: true,
      },
    }),
  ]);

  return (purchases._sum.energy || 0) - (spendings._sum.energyCost || 0);
}

export default t.router({
  /**
   * Get current energy balance.
   */
  get: t.procedure
    .input(
      z.object({
        authToken: z.string(),
      })
    )
    .query(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      return {
        energy: await getEnergyBalance(inputAuth.id),
      };
    }),

  /**
   * Subscribe to energy changes (additions and subtractions).
   */
  onDelta: t.procedure
    .input(
      z.object({
        authToken: z.string(),
      })
    )
    .subscription(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      return observable<number>((emit) => {
        const cancels = [
          pgListen("OnChainEnergyPurchaseChannel", async (payload: any) => {
            const purchase = JSON.parse(payload);
            if (purchase.userId != inputAuth.id) return;
            emit.next(+purchase.energy);
          }),

          pgListen("UserMessageChannel", async (payload: any) => {
            const message = JSON.parse(payload);
            if (message.userId != inputAuth.id) return;
            emit.next(-message.energyCost);
          }),
        ];

        return () => {
          Promise.all(cancels).then((cancels) => cancels.forEach((c) => c()));
        };
      });
    }),
});
