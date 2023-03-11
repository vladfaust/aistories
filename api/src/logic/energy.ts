import { PrismaClient } from "@prisma/client";
import * as redis from "@/services/redis";

const prisma = new PrismaClient();

export function fromWeb3PurchasesKey(userId: string): string {
  return `users:${userId}:energy:fromWeb3Purchases`;
}

export function fromStoryContentKey(userId: string): string {
  return `users:${userId}:energy:fromStoryContent`;
}

export function fromGrantsKey(userId: string): string {
  return `users:${userId}:energy:fromGrants`;
}

export async function getBalance(userId: string): Promise<number> {
  const [fromWeb3Purchases, fromStoryContent, fromGrants] = await Promise.all([
    parseFloat(
      await redis.cachedOr(fromWeb3PurchasesKey(userId), async () =>
        (
          await prisma.web3EnergyPurchase.findMany({
            where: { userId },
            select: { amount: true },
          })
        )
          .reduce((acc, cur) => acc + cur.amount, 0)
          .toString()
      )
    ),

    parseFloat(
      await redis.cachedOr(fromStoryContentKey(userId), async () =>
        (
          await prisma.story.findMany({
            where: { userId },
            include: {
              Content: {
                select: {
                  energyUsage: true,
                },
              },
            },
          })
        )
          .reduce(
            (acc, story) =>
              acc +
              story.Content.reduce(
                (acc, content) => acc + (content.energyUsage || 0),
                0
              ),
            0
          )
          .toString()
      )
    ),

    parseFloat(
      await redis.cachedOr(fromGrantsKey(userId), async () =>
        (
          await prisma.energyGrant.findMany({
            where: { userId },
            select: { amount: true },
          })
        )
          .reduce((acc, cur) => acc + cur.amount, 0)
          .toString()
      )
    ),
  ]);

  return fromWeb3Purchases - fromStoryContent + fromGrants;
}
