import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { encode } from "gpt-3-encoder";
import { PrismaClient } from "@prisma/client";

export const NAME_MAX_LENGTH = 32;
export const ABOUT_MAX_LENGTH = 512;
export const PROMPT_MAX_TOKEN_LENGTH = 512;

const prisma = new PrismaClient();

/**
 * Create a new lore.
 */
export default protectedProcedure
  .input(
    z.object({
      public: z.boolean(),
      name: z.string(),
      about: z.string(),
      prompt: z.string(),
    })
  )
  .output(
    z.object({
      id: z.number(),
    })
  )
  .mutation(async ({ ctx, input }) => {
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

    if (encode(input.prompt).length > PROMPT_MAX_TOKEN_LENGTH) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "prompt is too long",
      });
    }

    const lore = await prisma.lore.create({
      data: {
        creatorId: ctx.user.id,
        public: input.public,
        name: input.name,
        about: input.about,
        setup: input.prompt,
      },
    });

    return {
      id: lore.id,
    };
  });
