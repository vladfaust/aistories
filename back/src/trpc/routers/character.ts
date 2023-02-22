import { t } from "../../trpc/index";
import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient();

export default t.router({
  getAll: t.procedure.query(async () => {
    return prisma.character.findMany({
      select: {
        id: true,
        name: true,
        imagePreviewUrl: true,
        about: true,
        erc1155Address: true,
        erc1155Id: true,
      },
    });
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
          name: true,
          imagePreviewUrl: true,
          about: true,
          erc1155Address: true,
          erc1155Id: true,
        },
      });
    }),
});
