import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// OPTIMIZE: Store energy balance in user table, or cache it in memory.
export async function getEnergyBalance(userId: number, prismaClient = prisma) {
  const [purchases, spendings] = await Promise.all([
    prismaClient.web3EnergyPurchase.aggregate({
      where: {
        Identity: {
          userId,
        },
      },
      _sum: {
        energy: true,
      },
    }),

    prismaClient.storyContent.aggregate({
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
