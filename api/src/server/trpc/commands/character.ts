import { t } from "#trpc";
import { PrismaClient } from "@prisma/client";
import z from "zod";
import { Erc1155Token } from "./story/create";

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
      const char = await prisma.character.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          loreId: true,
          imagePreviewUrl: true,
          name: true,
          about: true,
          erc1155Token: true,
        },
      });

      if (char) {
        return {
          ...char,
          erc1155Token: char.erc1155Token
            ? (JSON.parse(char.erc1155Token) as Erc1155Token)
            : null,
        };
      } else {
        return null;
      }
    }),
});
