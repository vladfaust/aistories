import t from "#trpc";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Returns a list of all character IDs.
 */
// TODO: Hide private characters, similar to ../lores/index.ts.
export default t.procedure.query(async () => {
  return (
    await prisma.character.findMany({
      where: { id: { gt: 0 } },
      select: { id: true },
      orderBy: { id: "asc" },
    })
  ).map((c) => c.id);
});
