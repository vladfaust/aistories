import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { encode } from "gpt-3-encoder";
import { PrismaClient } from "@prisma/client";

export const NAME_MAX_LENGTH = 32;
export const ABOUT_MAX_LENGTH = 256;
export const PERSONALITY_MAX_TOKEN_LENGTH = 512;

const prisma = new PrismaClient();

/**
 * Create a new lore.
 */
export default protectedProcedure
  .input(
    z.object({
      loreId: z.number(),
      public: z.boolean(),
      name: z.string(),
      about: z.string(),
      personality: z.string(),
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

    if (input.name.length > NAME_MAX_LENGTH) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "name is too long",
      });
    }

    if (input.about.length > ABOUT_MAX_LENGTH) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "about is too long",
      });
    }

    if (encode(input.personality).length > PERSONALITY_MAX_TOKEN_LENGTH) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "personality is too long",
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
      },
    });

    return {
      charId: char.id,
    };
  });
