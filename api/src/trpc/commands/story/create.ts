import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

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
      select: { id: true },
    });

    if (characters.length !== 1 + nonUserCharacterIds.size) {
      throw new Error("Character not found");
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
