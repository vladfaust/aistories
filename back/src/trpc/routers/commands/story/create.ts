import { erc1155Balance } from "@/services/eth";
import { chooseRandom, toHex } from "@/utils";
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
    // 1. Check that the character exists.
    // 2. Check that the user owns the character.
    // 3. Create a new story.
    // 4. Ensure that a character is selected to start the story.

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
        erc1155Address: true,
        erc1155Id: true,
      },
    });

    if (characters.length !== 1 + nonUserCharacterIds.size) {
      throw new Error("Character not found");
    }

    for (const character of characters) {
      if (character.erc1155Address) {
        if (!character.erc1155Id) throw new Error("Invalid ERC1155 id");

        const web3Identity = await prisma.web3Identity.findFirst({
          where: {
            userId: ctx.user.id,
          },
          select: {
            address: true,
          },
        });

        if (!web3Identity) {
          throw new Error("User has no Web3 provider");
        }

        const balance = await erc1155Balance(
          toHex(character.erc1155Address),
          toHex(character.erc1155Id),
          toHex(web3Identity.address)
        );

        if (balance.isZero()) {
          throw new Error("Insufficient character token balance");
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
        nextCharId: chooseRandom([...nonUserCharacterIds]),
        fabula: input.fabula,
        busy: true, // The first actor is a character.
      },
    });

    return story.id;
  });
