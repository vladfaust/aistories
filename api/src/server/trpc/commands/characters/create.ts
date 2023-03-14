import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { encode } from "gpt-3-encoder";
import { PrismaClient } from "@prisma/client";
import Web3Token from "web3-token";
import * as eth from "@/services/eth";
import { toBuffer } from "@/utils";
import { BigNumber } from "ethers";

export const SCHEMA = {
  name: z.string().min(1).max(32),
  about: z.string().min(16).max(256),
  personality: z
    .string()
    .trim()
    .min(32)
    .refine((v) => encode(v).length <= 512, {
      message: "personality is too long",
    }),
  nft: z.object({
    contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    tokenId: z.string().regex(/^0x[a-fA-F0-9]{1,64}$/),
    uri: z.string().url().min(1).max(256),
    web3Token: z.string(), // Proof of ownership
  }),
};

export async function ensureNftOwnership(input: {
  contractAddress: Buffer;
  tokenId: Buffer;
  web3Token: string;
}) {
  let address;

  try {
    address = Web3Token.verify(input.web3Token).address;
  } catch (e: any) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Web3 token error: " + e.message,
    });
  }

  let nftOwnership = false;
  try {
    nftOwnership = await eth.nftOwnership(
      toBuffer(input.contractAddress),
      BigNumber.from(input.tokenId),
      toBuffer(address)
    );
  } catch (e) {
    if (e instanceof eth.UnknownNFTContractError) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Unknown NFT contract",
      });
    } else {
      throw e;
    }
  }

  if (!nftOwnership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't own this NFT",
    });
  }
}

const prisma = new PrismaClient();

/**
 * Create a new lore.
 */
export default protectedProcedure
  .input(
    z.object({
      loreId: z.number().positive(),
      public: z.boolean(),
      name: SCHEMA.name,
      about: SCHEMA.about,
      personality: SCHEMA.personality,
      nft: SCHEMA.nft.optional(),
    })
  )
  .output(
    z.object({
      charId: z.number(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const lore = await prisma.lore.findUnique({
      where: { id: input.loreId },
    });

    if (!lore) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Lore not found",
      });
    }

    if (input.nft) {
      await ensureNftOwnership({
        contractAddress: toBuffer(input.nft.contractAddress),
        tokenId: toBuffer(input.nft.tokenId),
        web3Token: input.nft.web3Token,
      });
    }

    const char = await prisma.character.create({
      data: {
        loreId: input.loreId,
        creatorId: ctx.user.id,
        public: input.public,
        name: input.name,
        about: input.about,
        personality: input.personality,
        nftContractAddress: input.nft
          ? toBuffer(input.nft.contractAddress)
          : null,
        nftTokenId: input.nft ? toBuffer(input.nft.tokenId) : null,
        nftUri: input.nft?.uri,
      },
    });

    return {
      charId: char.id,
    };
  });
