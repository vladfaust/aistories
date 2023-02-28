import { PrismaClient } from "@prisma/client";

// OPTIMIZE: Cache the settings.
//

const prisma = new PrismaClient();

export async function get(key: string): Promise<string> {
  const result = await prisma.settings.findUniqueOrThrow({
    where: { key },
    select: { value: true },
  });

  return result.value;
}

export async function set(key: string, value: string): Promise<void> {
  await prisma.settings.update({
    where: { key },
    data: { value },
  });
}
