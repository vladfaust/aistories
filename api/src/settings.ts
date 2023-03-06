import { PrismaClient } from "@prisma/client";

// OPTIMIZE: Cache the settings.
//

const prisma = new PrismaClient();

export async function get(key: string): Promise<string> {
  const result = await maybeGet(key);
  if (!result) throw new Error(`Setting "${key}" not found.`);
  return result;
}

export async function maybeGet(key: string): Promise<string | null> {
  const result = await prisma.settings.findUnique({
    where: { key },
    select: { value: true },
  });

  return result?.value ?? null;
}

export async function set(key: string, value: string): Promise<void> {
  await prisma.settings.update({
    where: { key },
    data: { value },
  });
}
