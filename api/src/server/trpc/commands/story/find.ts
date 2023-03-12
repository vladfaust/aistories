import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { t } from "#trpc";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();

/**
 * Find a story by its ID.
 */
export default t.procedure
  .input(z.object({ storyId: z.string() }))
  .query(async ({ input }) => {
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
      select: {
        id: true,
        loreId: true,
        userId: true,
        userCharId: true,
        charIds: true,
        name: true,
        fabula: true,
        reason: true,
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

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
    }

    return story;
  });
