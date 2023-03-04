import { t } from "#trpc";
import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient();

export default t.router({
  /**
   * Returns a list of all collection IDs.
   */
  index: t.procedure.query(async () => {
    return (
      await prisma.characterCollection.findMany({
        where: { id: { gt: 0 } },
        select: { id: true },
      })
    ).map((c) => c.id);
  }),

  /**
   * Find a collection by ID.
   */
  find: t.procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return prisma.characterCollection.findUnique({
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
