import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "@/trpc/middleware/auth";

const prisma = new PrismaClient();

/**
 * Get the content history of a story, in descending order, sorted by timestamp.
 * TODO: Pagination.
 * TODO: Public stories.
 */
export default protectedProcedure
  .input(
    z.object({
      storyId: z.number().positive(),
    })
  )
  .query(async ({ ctx, input }) => {
    // Ensure that the user has access to the story.
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
      select: { userIds: true },
    });

    if (!story || !story.userIds.includes(ctx.user.id)) {
      throw new Error("Story not found");
    }

    return prisma.storyContent.findMany({
      where: {
        storyId: input.storyId,
      },
      select: {
        id: true,
        charId: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  });
