import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import Web3Token from "web3-token";
import { maybeVerifyCharOwnership as maybeVerifyCharOwnership } from "./shared";

export type Erc1155Token = {
  contractAddress: string; // Hex string.
  tokenId: string; // Hex string.
  uri: string; // URI to the NFT page.
};

const prisma = new PrismaClient();

/**
 * Create a new story for a user and a character.
 * Requires ownership of the character.
 * TODO: Multiple characters per story.
 */
export default protectedProcedure
  .input(
    z.object({
      loreId: z.number().positive(),
      userCharacterId: z.number().positive(),

      // FIXME: Use `zod.set`.
      nonUserCharacterIds: z.array(z.number().positive()),

      fabula: z.string().optional(),

      // Optional Web3 token for NFT stuff.
      web3Token: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const nonUserCharacterIds = new Set(input.nonUserCharacterIds);

    if (nonUserCharacterIds.size !== input.nonUserCharacterIds.length) {
      throw new Error("Duplicate character id");
    }

    if (nonUserCharacterIds.size === 0) {
      throw new Error("Empty character list");
    }

    const lore = await prisma.lore.findUnique({
      where: { id: input.loreId },
      select: { id: true },
    });

    if (!lore) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Lore not found",
      });
    }

    const characters = await prisma.character.findMany({
      where: {
        id: {
          in: [input.userCharacterId, ...nonUserCharacterIds],
        },
      },
      select: {
        id: true,
        erc1155Token: true,
      },
    });

    if (characters.length !== 1 + nonUserCharacterIds.size) {
      throw new Error("Character not found");
    }

    const address = input.web3Token
      ? Web3Token.verify(input.web3Token).address
      : undefined;

    for (const character of characters) {
      await maybeVerifyCharOwnership(character, address);
    }

    const story = await prisma.story.create({
      data: {
        id: nanoid(),
        loreId: input.loreId,
        charIds: [input.userCharacterId, ...nonUserCharacterIds],
        userId: ctx.user.id,
        userCharId: input.userCharacterId,
        fabula: input.fabula,
      },
    });

    return story.id;
  });
