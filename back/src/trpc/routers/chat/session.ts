import { z } from "zod";
import { t } from "../../index";
import initialize from "./session/initialize";
import sendMessage from "./session/sendMessage";
import { PrismaClient } from "@prisma/client";
import { upsertUser } from "@/trpc/context";

const prisma = new PrismaClient();

export default t.router({
  initialize,
  sendMessage,

  findActive: t.procedure
    .input(
      z.object({
        authToken: z.string(),
        chat: z.object({
          characterId: z.number().positive(),
        }),
      })
    )
    .output(
      z.object({
        sessionId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const inputAuth = await upsertUser(input.authToken);

      const session = await prisma.chatSession.findFirst({
        where: {
          AND: {
            Chat: {
              AND: {
                userId: inputAuth.id,
                characterId: input.chat.characterId,
              },
            },
            endedAt: {
              gt: new Date(),
            },
          },
        },
        select: {
          id: true,
        },
      });

      return {
        sessionId: session?.id,
      };
    }),
});
