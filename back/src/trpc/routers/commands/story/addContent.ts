import konsole from "@/services/konsole";
import { chooseRandom } from "@/utils";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/middleware/auth";
import { encode } from "gpt-3-encoder";

const prisma = new PrismaClient();

/**
 * Send a message to a story.
 * Requires energy.
 */
export default protectedProcedure
  .input(
    z.object({
      storyId: z.number().positive(),
      content: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const content = await prisma.$transaction(async (p) => {
      const story = await p.story.findUnique({
        where: {
          id: input.storyId,
        },
        select: {
          charIds: true,
          userId: true,
          userCharId: true,
          nextCharId: true,
          busy: true,
          buffer: true,
        },
      });

      // Check that the user has access to the story.
      if (!story || story.userId !== ctx.user.id) {
        throw new Error("Story not found");
      }

      // Check that the story is not busy.
      if (story.busy) {
        throw new Error("Story is busy");
      }

      // Check that the user is the next actor.
      if (story.nextCharId !== story.userCharId) {
        throw new Error("Not your turn");
      }

      const content = await p.storyContent.create({
        data: {
          storyId: input.storyId,
          charId: story.userCharId,
          userId: ctx.user.id,
          tokenLength: encode(input.content).length,
          content: input.content,
        },
        select: {
          id: true,
        },
      });

      await p.story.update({
        where: {
          id: input.storyId,
        },
        data: {
          busy: true,
          buffer: story.buffer.concat(content.id),
          nextCharId: chooseRandom(
            story.charIds.filter((id) => id !== story.userCharId)
          ),
        },
      });

      return content;
    });

    konsole.log(["story", "addContent"], "User content", {
      storyId: input.storyId,
      userId: ctx.user.id,
      content: input.content,
    });

    return content.id;
  });
