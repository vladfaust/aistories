import t from "#trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export default t.procedure
  .input(
    z.object({
      id: z.number(),
    })
  )
  .query(async ({ ctx, input }) => {
    const char = await prisma.character.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        loreId: true,
        creatorId: true,
        public: true,
        name: true,
        about: true,
        personality: true,
        nftContractAddress: true,
        nftTokenId: true,
        nftUri: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!char) return null;
    if (!char.public && char.creatorId !== ctx.user?.id) return null;

    if (char.creatorId === ctx.user?.id) {
      return char;
    } else {
      return {
        ...char,
        personality: undefined, // Hide personality from non-owners
      };
    }
  });
