import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { encode } from "gpt-3-encoder";
import { PrismaClient } from "@prisma/client";
import {
  NAME_MAX_LENGTH,
  ABOUT_MAX_LENGTH,
  PERSONALITY_MAX_TOKEN_LENGTH,
} from "./create";

const prisma = new PrismaClient();

/**
 * Update an existing lore.
 */
export default protectedProcedure
  .input(
    z.object({
      charId: z.number(),
      public: z.boolean().optional(),
      name: z.string().optional(),
      about: z.string().optional(),
      personality: z.string().optional(),
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
      input.personality === undefined
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

    if (input.name && input.name.length > NAME_MAX_LENGTH) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "name is too long",
      });
    }

    if (input.about && input.about.length > ABOUT_MAX_LENGTH) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "about is too long",
      });
    }

    if (
      input.personality &&
      encode(input.personality).length > PERSONALITY_MAX_TOKEN_LENGTH
    ) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "personality is too long",
      });
    }

    await prisma.character.update({
      where: { id: input.charId },
      data: {
        public: input.public ?? char.public,
        name: input.name ?? char.name,
        about: input.about ?? char.about,
        personality: input.personality ?? char.personality,
      },
    });
  });
