import konsole from "@/services/konsole";
import { upsertUser } from "@/trpc/context";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { t } from "../../index";
import { getEnergyBalance } from "../user/energy";

const prisma = new PrismaClient();

/**
 * Send a message to a story.
 * Requires energy.
 */
export default t.procedure
  .input(
    z.object({
      authToken: z.string(),
      storyId: z.number().positive(),
      message: z.object({
        text: z.string(),
      }),
    })
  )
  .mutation(async ({ input }) => {
    const inputAuth = await upsertUser(input.authToken);

    // Check that user has enough energy, and if so, send the message.
    const [, userMessage] = await prisma.$transaction(async (p) => {
      // Check that the user has access to the story.
      const story = await p.story.findUnique({
        where: {
          id: input.storyId,
        },
        select: {
          userId: true,
          busy: true,
        },
      });

      if (!story || story.userId !== inputAuth.id) {
        throw new Error("Story not found");
      }

      // Check that the story is not busy.
      if (story.busy) {
        throw new Error("Story is busy");
      }

      // @ts-expect-error 2345
      const energy = await getEnergyBalance(inputAuth.id, p);

      if (energy < 1) {
        throw new Error("Not enough energy");
      }

      return Promise.all([
        p.story.update({
          where: {
            id: input.storyId,
          },
          data: {
            busy: true,
          },
        }),
        p.userMessage.create({
          data: {
            storyId: input.storyId,
            userId: inputAuth.id,
            energyCost: 1,
            content: input.message.text,
          },
          select: {
            id: true,
          },
        }),
      ]);
    });

    konsole.log(["story", "sendMessage"], "User message", {
      storyId: input.storyId,
      userId: inputAuth.id,
      messageId: userMessage.id,
    });

    return userMessage.id;
  });
