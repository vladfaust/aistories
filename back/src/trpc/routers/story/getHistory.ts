import { upsertUser } from "@/trpc/context";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { t } from "../../../trpc/index";

const prisma = new PrismaClient();

/**
 * Get the content history of a story, in descending order, sorted by timestamp.
 * TODO: Pagination.
 */
export default t.procedure
  .input(
    z.object({
      authToken: z.string(),
      storyId: z.number().positive(),
    })
  )
  .query(async ({ input }) => {
    const inputAuth = await upsertUser(input.authToken);

    // Ensure that the user has access to the story.
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
      select: { userIds: true },
    });

    if (!story || !story.userIds.includes(inputAuth.id)) {
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
