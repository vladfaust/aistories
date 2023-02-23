import { z } from "zod";
import { t } from "../../index";
import initialize from "./session/initialize";
import sendMessage from "./session/sendMessage";
import { PrismaClient } from "@prisma/client";
import { upsertUser } from "@/trpc/context";
import * as ai from "@/ai";

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
          endedAt: true,
          pid: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (session) {
        const process = ai.processes[session.pid];

        if (!process) {
          return null; // throw new Error("Process not found, re-initialize session");
        }
      }

      return session;
    }),
});
