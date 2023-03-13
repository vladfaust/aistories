import t from "#trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Returns a list of all character IDs that belong to a given lore.
 */
export default t.procedure
  .input(
    z.object({
      loreId: z.number(),
    })
  )
  .query(async ({ input }) => {
    return (
      await prisma.character.findMany({
        where: { loreId: input.loreId },
        select: { id: true },
      })
    ).map((c) => c.id);
  });
