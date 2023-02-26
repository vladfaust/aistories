import { erc1155Balance } from "@/services/eth";
import { upsertUser } from "@/trpc/context";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
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
      characterId: z.number().positive(),
      fabula: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const inputAuth = await upsertUser(input.authToken);

    // 1. Check that the character exists.
    // 2. Check that the user owns the character.
    // 3. Create a new story.

    const character = await prisma.character.findUnique({
      where: {
        id: input.characterId,
      },
      select: {
        id: true,
        erc1155Address: true,
        erc1155Id: true,
      },
    });

    if (!character) {
      throw new Error("Character not found.");
    }

    if (character.erc1155Address) {
      if (!character.erc1155Id) throw new Error("Invalid ERC1155 id");

      const balance = await erc1155Balance(
        ethers.utils.hexlify(character.erc1155Address),
        ethers.utils.hexlify(character.erc1155Id),
        ethers.utils.hexlify(inputAuth.evmAddress)
      );

      if (balance.isZero()) {
        throw new Error("Insufficient character token balance");
      }
    }

    const story = await prisma.story.create({
      data: {
        userId: inputAuth.id,
        characterId: character.id,
        fabula: input.fabula,
        busy: false,
      },
    });

    return story.id;
  });
