import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { lock } from "./shared";
import { ensureNftOwnership } from "../characters/create";

const MAX_CHARS = 5;
const prisma = new PrismaClient();

export default protectedProcedure
  .input(
    z.object({
      storyId: z.string(),
      charId: z.number(),

      // Optional Web3 token for NFT stuff.
      web3Token: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const story = await prisma.story.findFirst({
      where: { id: input.storyId },
      select: {
        id: true,
        userId: true,
        charIds: true,
      },
    });

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
    }

    if (story.userId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not your story" });
    }

    const char = await prisma.character.findFirst({
      where: { id: input.charId },
      select: {
        id: true,
        creatorId: true,
        public: true,
        nftContractAddress: true,
        nftTokenId: true,
      },
    });

    if (!char) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Character not found",
      });
    }

    if (!char.public && char.creatorId !== ctx.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not your character",
      });
    }

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

    if (story.charIds.length >= MAX_CHARS) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Story already has maximum characters",
      });
    }

    if (story.charIds.includes(input.charId)) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Character already in story",
      });
    }

    const unlock = await lock(input.storyId);

    try {
      await prisma.story.update({
        where: { id: input.storyId },
        data: { charIds: [...new Set(story.charIds.concat([input.charId]))] },
      });
    } finally {
      await unlock();
    }
  });
