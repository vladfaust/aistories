import { t } from "#trpc";
import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient();

export default t.router({
  /**
   * Returns a list of all lore IDs.
   */
  index: t.procedure.query(async () => {
    return (
      await prisma.lore.findMany({
        where: { id: { gt: 0 } },
        select: { id: true },
      })
    ).map((l) => l.id);
  }),

  /**
   * Find a lore by ID.
   */
  find: t.procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return prisma.lore.findUnique({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          imageUrl: true,
          name: true,
          about: true,
        },
      });
    }),
});
