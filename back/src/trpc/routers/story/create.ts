import { erc1155Balance } from "@/services/eth";
import { upsertUser } from "@/trpc/context";
import { chooseRandom, toHex } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { t } from "../../../trpc/index";

const prisma = new PrismaClient();

/**
 * Create a new story for a user and a character.
 * Requires ownership of the character.
 * TODO: Multiple characters per story.
 */
export default t.procedure
  .input(
    z.object({
      authToken: z.string(),
      userCharacterId: z.number().positive(),

      // FIXME: Use `zod.set`.
      nonUserCharacterIds: z.array(z.number().positive()),

      setup: z.string().optional(),
      fabula: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const inputAuth = await upsertUser(input.authToken);

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

        const balance = await erc1155Balance(
          toHex(character.erc1155Address),
          toHex(character.erc1155Id),
          toHex(inputAuth.evmAddress)
        );

        if (balance.isZero()) {
          throw new Error("Insufficient character token balance");
        }
      }
    }

    const story = await prisma.story.create({
      data: {
        charIds: [input.userCharacterId, ...nonUserCharacterIds],
        userIds: [inputAuth.id],
        userMap: JSON.stringify({ [inputAuth.id]: input.userCharacterId }),
        nextCharId: chooseRandom([...nonUserCharacterIds]),
        setup: input.setup,
        fabula: input.fabula,
        busy: true, // The first actor is a character.
      },
    });

    return story.id;
  });
