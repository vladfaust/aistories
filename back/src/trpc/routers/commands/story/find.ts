import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/middleware/auth";

const prisma = new PrismaClient();

/**
 * Find a story by its ID.
 * TODO: Public stories.
 */
export default protectedProcedure
  .input(
    z.object({
      storyId: z.number().positive(),
    })
  )
  .query(async ({ ctx, input }) => {
    const story = await prisma.story.findUnique({
      where: {
        id: input.storyId,
      },
      select: {
        id: true,
        userIds: true,
        userMap: true,
        charIds: true,
        nextCharId: true,
        name: true,
        fabula: true,
        updatedAt: true,
        createdAt: true,
        Content: {
          select: {
            id: true,
            charId: true,
            content: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!story || !story.userIds.includes(ctx.user.id)) {
      throw new Error("Story not found");
    }

    return story;
  });
