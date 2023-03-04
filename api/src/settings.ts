import { PrismaClient } from "@prisma/client";

// OPTIMIZE: Cache the settings.
//

const prisma = new PrismaClient();

export async function get(key: string): Promise<string> {
  const result = await prisma.settings.findUnique({
    where: { key },
    select: { value: true },
  });

  if (!result) throw new Error(`Setting "${key}" not found.`);

  return result.value;
}

export async function set(key: string, value: string): Promise<void> {
  await prisma.settings.update({
    where: { key },
    data: { value },
  });
}
