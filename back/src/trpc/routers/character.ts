import { t } from "../../trpc/index";
import { PrismaClient } from "@prisma/client";
import z from "zod";

const prisma = new PrismaClient();

export default t.router({
  getAll: t.procedure.query(async () => {
    return prisma.character.findMany({
      select: {
        actorId: true,
        name: true,
        imagePreviewUrl: true,
        about: true,
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
          actorId: input.id,
        },
        select: {
          actorId: true,
          name: true,
          imagePreviewUrl: true,
          about: true,
        },
      });
    }),
});
