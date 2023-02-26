import { upsertUser } from "@/trpc/context";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { t } from "../../../trpc/index";

const prisma = new PrismaClient();

/**
 * Get the history of a story, in descending order, sorted by timestamp.
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
      where: {
        id: input.storyId,
      },
      select: {
        userId: true,
      },
    });

    if (!story || story.userId !== inputAuth.id) {
      throw new Error("Story not found.");
    }

    // Return UserMessage and CharacterMessage associated with the story.
    const [userMessages, characterMessages] = await Promise.all([
      prisma.userMessage.findMany({
        where: {
          storyId: input.storyId,
        },
        select: {
          id: true,
          userId: true,
          content: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.characterMessage.findMany({
        where: {
          storyId: input.storyId,
        },
        select: {
          id: true,
          characterId: true,
          content: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return [...userMessages, ...characterMessages].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  });
