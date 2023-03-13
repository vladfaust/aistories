import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { encode } from "gpt-3-encoder";
import { PrismaClient } from "@prisma/client";
import {
  NAME_MAX_LENGTH,
  ABOUT_MAX_LENGTH,
  PROMPT_MAX_TOKEN_LENGTH,
} from "./create";

const prisma = new PrismaClient();

/**
 * Update an existing lore.
 */
export default protectedProcedure
  .input(
    z.object({
      loreId: z.number(),
      public: z.boolean().optional(),
      name: z.string().optional(),
      about: z.string().optional(),
      prompt: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const lore = await prisma.lore.findUnique({
      where: { id: input.loreId },
      select: {
        creatorId: true,
        public: true,
        name: true,
        about: true,
        setup: true,
      },
    });

    if (!lore) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Lore not found",
      });
    }

    if (lore.creatorId !== ctx.user.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not the creator of this lore",
      });
    }

    if (!input.public && !input.name && !input.about && !input.prompt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No changes",
      });
    }

    if (input.public === false && lore.public === true) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot make a public lore private",
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

    if (input.prompt && encode(input.prompt).length > PROMPT_MAX_TOKEN_LENGTH) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "prompt is too long",
      });
    }

    await prisma.lore.update({
      where: { id: input.loreId },
      data: {
        public: input.public ?? lore.public,
        name: input.name ?? lore.name,
        about: input.about ?? lore.about,
        setup: input.prompt ?? lore.setup,
      },
    });
  });
