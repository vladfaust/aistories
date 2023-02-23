import { z } from "zod";
import { t } from "@/trpc/index";
import * as ai from "@/ai.js";
import { PrismaClient } from "@prisma/client";
import { upsertUser } from "@/trpc/context";
import { ethers } from "ethers";
import erc1155Abi from "~/abi/erc1155.json" assert { type: "json" };
import { provider } from "@/services/eth";

const SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const prisma = new PrismaClient();

export default t.procedure
  .input(
    z.object({
      authToken: z.string(),
      characterId: z.number().positive(),
    })
  )
  .mutation(async ({ input }) => {
    const inputAuth = await upsertUser(input.authToken);

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
      throw new Error("Character not found");
    }

    if (character.erc1155Address) {
      if (!character.erc1155Id) throw new Error("Invalid ERC1155 ID");

      // Check the user's balance.
      const contract = new ethers.Contract(
        ethers.utils.hexlify(character.erc1155Address),
        erc1155Abi,
        provider
      );

      const balance = await contract.balanceOf(
        ethers.utils.hexlify(inputAuth.evmAddress),
        character.erc1155Id!
      );

      if (balance.isZero()) {
        throw new Error("Insufficient character token balance");
      }
    }

    const chat = await prisma.chat.upsert({
      where: {
        userId_characterId: {
          userId: inputAuth.id,
          characterId: input.characterId,
        },
      },
      update: {},
      create: {
        userId: inputAuth.id,
        characterId: input.characterId,
      },
      select: {
        id: true,
        conversationSummary: true,
        conversationBuffer: true,
        Character: {
          select: {
            promptTemplate: true,
            summarizerTemplate: true,
          },
        },
      },
    });

    let session = await prisma.chatSession.findFirst({
      where: {
        chatId: chat.id,
        endedAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        pid: true,
        endedAt: true,
      },
    });

    if (session) {
      console.log("Found existing session", {
        chatId: chat.id,
        sessionId: session.id,
      });

      if (ai.processes[session.pid]) {
        console.log("Process is alive", {
          sessionId: session.id,
          pid: session.pid,
        });
      } else {
        console.log("Re-spawning process...", {
          sessionId: session.id,
          pid: session.pid,
        });

        const process = ai.spawnProcess({
          promptTemplate: chat.Character.promptTemplate,
          summarizerTemplate: chat.Character.summarizerTemplate || undefined,
          conversationSummary: chat.conversationSummary,
          conversationBuffer: JSON.parse(chat.conversationBuffer),
        });

        await prisma.chatSession.update({
          where: {
            id: session.id,
          },
          data: {
            pid: process.pid!,
          },
        });
      }
    }

    if (!session) {
      console.log("Creating new session...", { chatId: chat.id });

      const process = ai.spawnProcess({
        promptTemplate: chat.Character.promptTemplate,
        summarizerTemplate: chat.Character.summarizerTemplate || undefined,
        conversationSummary: chat.conversationSummary,
        conversationBuffer: JSON.parse(chat.conversationBuffer),
      });

      session = await prisma.chatSession.create({
        data: {
          pid: process.pid!,
          Chat: {
            connect: {
              id: chat.id,
            },
          },
          endedAt: new Date(new Date().valueOf() + SESSION_DURATION_MS),
        },
      });
    }

    return session;
  });
