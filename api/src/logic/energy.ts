import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * OPTIMIZE: Cache.
 */
export async function getBalance(userId: string): Promise<number> {
  const [web3Purchases, stories, grants] = await Promise.all([
    prisma.web3EnergyPurchase.findMany({
      where: { userId },
      select: { amount: true },
    }),
    prisma.story.findMany({
      where: { userId },
      include: {
        Content: {
          select: {
            energyUsage: true,
          },
        },
      },
    }),
    prisma.energyGrant.findMany({
      where: { userId },
      select: { amount: true },
    }),
  ]);

  const web3PurchasesEnergy = web3Purchases.reduce(
    (acc, cur) => acc + cur.amount,
    0
  );

  const contentEnergy = stories.reduce(
    (acc, story) =>
      acc +
      story.Content.reduce(
        (acc, content) => acc + (content.energyUsage || 0),
        0
      ),
    0
  );

  const grantsEnergy = grants.reduce((acc, cur) => acc + cur.amount, 0);

  return web3PurchasesEnergy - contentEnergy + grantsEnergy;
}
