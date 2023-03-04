import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { t } from "#trpc";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();

/**
 * Get the content history of a story, in descending order, sorted by timestamp.
 * TODO: Pagination.
 */
export default t.procedure
  .input(z.object({ storyId: z.string() }))
  .query(async ({ input }) => {
    // Ensure that the user has access to the story.
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
      select: { userId: true },
    });

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
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
