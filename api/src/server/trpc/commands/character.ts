import { t } from "#trpc";
import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient();

export default t.router({
  /**
   * Returns a list of all character IDs.
   */
  index: t.procedure.query(async () => {
    return (
      await prisma.character.findMany({
        where: { id: { gt: 0 } },
        select: { id: true },
      })
    ).map((c) => c.id);
  }),

  find: t.procedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(async ({ input }) => {
      return prisma.character.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          collectionId: true,
          imagePreviewUrl: true,
          name: true,
          about: true,
        },
      });
    }),
});
