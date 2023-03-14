import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { PrismaClient } from "@prisma/client";
import { ensureNftOwnership, SCHEMA } from "./create";
import { toBuffer } from "@/utils";

const prisma = new PrismaClient();

/**
 * Update an existing character.
 */
export default protectedProcedure
  .input(
    z.object({
      charId: z.number(),
      public: z.boolean().optional(),
      name: SCHEMA.name.optional(),
      about: SCHEMA.about.optional(),
      personality: SCHEMA.personality.optional(),
      nft: z
        .union([
          SCHEMA.nft,
          z.object({
            uri: SCHEMA.nft.shape.uri,
            web3Token: SCHEMA.nft.shape.web3Token,
          }),
        ])
        .optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const char = await prisma.character.findUnique({
      where: { id: input.charId },
      select: {
        creatorId: true,
        public: true,
        name: true,
        about: true,
        personality: true,
        nftContractAddress: true,
        nftTokenId: true,
        nftUri: true,
      },
    });

    if (!char) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Character not found",
      });
    }

    if (char.creatorId !== ctx.user.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not the creator of this character",
      });
    }

    if (
      input.public === undefined &&
      input.name === undefined &&
      input.about === undefined &&
      input.personality === undefined &&
      input.nft === undefined
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No changes",
      });
    }

    if (input.public === false && char.public === true) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot make a public character private",
      });
    }

    if (input.nft) {
      if ("contractAddress" in input.nft) {
        if (char.nftContractAddress) {
          // Want to change NFT essentially.
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot change NFT",
          });
        }
      } else if (!char.nftContractAddress) {
        // Want to update uri, but NFT not enabled.
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "NFT not enabled for this character",
        });
      }

      await ensureNftOwnership({
        contractAddress:
          "contractAddress" in input.nft
            ? toBuffer(input.nft.contractAddress)
            : char.nftContractAddress!,
        tokenId:
          "tokenId" in input.nft
            ? toBuffer(input.nft.tokenId)
            : char.nftTokenId!,
        web3Token: input.nft.web3Token,
      });
    }

    await prisma.character.update({
      where: { id: input.charId },
      data: {
        public: input.public ?? char.public,
        name: input.name ?? char.name,
        about: input.about ?? char.about,
        personality: input.personality ?? char.personality,
        nftContractAddress:
          input.nft && "contractAddress" in input.nft
            ? toBuffer(input.nft.contractAddress)
            : char.nftContractAddress,
        nftTokenId:
          input.nft && "tokenId" in input.nft
            ? toBuffer(input.nft.tokenId)
            : char.nftTokenId,
        nftUri: input.nft?.uri ?? char.nftUri,
      },
    });
  });
