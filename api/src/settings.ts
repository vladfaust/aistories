import { PrismaClient } from "@prisma/client";
import * as redis from "@/services/redis";

const prisma = new PrismaClient();

export async function get(key: string): Promise<string> {
  return redis.cachedOr(key, async () => {
    const value = (
      await prisma.settings.findUnique({
        where: { key },
        select: { value: true },
      })
    )?.value;
    if (!value) throw new Error(`Setting "${key}" not found.`);
    return value;
  });
}

export async function set(key: string, value: string): Promise<void> {
  await prisma.settings.update({
    where: { key },
    data: { value },
  });

  await redis.set(key, value);
}
