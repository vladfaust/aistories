import { t } from "../../trpc/index";
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
        select: {
          id: true,
        },
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
        where: {
          id: input.id,
        },
        select: {
          id: true,
          imagePreviewUrl: true,
          name: true,
          title: true,
          about: true,
          erc1155Address: true,
          erc1155Id: true,
          erc1155NftUri: true,
        },
      });
    }),
});
