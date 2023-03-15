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
  .output(z.array(z.number()))
  .query(async ({ ctx, input }) => {
    const chars = await prisma.character.findMany({
      where: { loreId: input.loreId },
      select: {
        id: true,
        creatorId: true,
        public: true,
      },
      orderBy: { id: "asc" },
    });

    return chars
      .filter((c) => c.public || ctx.user?.id === c.creatorId)
      .map((c) => c.id);
  });
