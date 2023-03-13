import t from "#trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Erc1155Token } from "#trpc/commands/story/create";

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
        erc1155Token: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!char) return null;
    if (!char.public && char.creatorId !== ctx.user?.id) return null;

    const erc1155Token = char.erc1155Token
      ? (JSON.parse(char.erc1155Token) as Erc1155Token)
      : null;

    if (char.creatorId === ctx.user?.id) {
      return {
        ...char,
        erc1155Token,
      };
    } else {
      return {
        ...char,
        personality: undefined,
        erc1155Token,
      };
    }
  });
