import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import Web3Token from "web3-token";
import { erc1155Balance } from "@/services/eth";

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
      collectionId: z.number().positive(),
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

    const collection = await prisma.characterCollection.findUnique({
      where: { id: input.collectionId },
      select: { id: true },
    });

    if (!collection) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Collection not found",
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

    let address: string | undefined;
    if (input.web3Token) {
      address = Web3Token.verify(input.web3Token).address;
    }

    for (const character of characters) {
      if (character.erc1155Token) {
        if (!address) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing Web3 token",
          });
        }

        const erc1155Token = JSON.parse(character.erc1155Token) as Erc1155Token;

        const balance = await erc1155Balance(
          erc1155Token.contractAddress,
          erc1155Token.tokenId,
          address
        );

        if (balance.eq(0)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient ERC1155 token balance",
          });
        }
      }
    }

    const story = await prisma.story.create({
      data: {
        id: nanoid(),
        collectionId: input.collectionId,
        charIds: [input.userCharacterId, ...nonUserCharacterIds],
        userId: ctx.user.id,
        userCharId: input.userCharacterId,
        fabula: input.fabula,
      },
    });

    return story.id;
  });
