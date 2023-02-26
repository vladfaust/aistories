import { upsertUser } from "@/trpc/context";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { t } from "../../../trpc/index";

const prisma = new PrismaClient();

/**
 * Find a story by its ID.
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

    const story = await prisma.story.findUnique({
      where: {
        id: input.storyId,
      },
      select: {
        id: true,
        userId: true,
        characterId: true,
        name: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!story || story.userId !== inputAuth.id) {
      throw new Error("Story not found.");
    }

    return story;
  });
