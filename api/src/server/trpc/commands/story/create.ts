import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import Web3Token from "web3-token";
import { ensureNftOwnership } from "../characters/create";

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
        nftContractAddress: true,
        nftTokenId: true,
      },
    });

    if (characters.length !== 1 + nonUserCharacterIds.size) {
      throw new Error("Character not found");
    }

    const address = input.web3Token
      ? Web3Token.verify(input.web3Token).address
      : undefined;

    for (const char of characters) {
      if (char.nftContractAddress && char.nftTokenId) {
        if (!input.web3Token) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing web3Token",
          });
        }

        await ensureNftOwnership({
          contractAddress: char.nftContractAddress,
          tokenId: char.nftTokenId,
          web3Token: input.web3Token,
        });
      }
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
