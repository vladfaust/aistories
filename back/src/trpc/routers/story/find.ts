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

    if (!story || !story.userIds.includes(inputAuth.id)) {
      throw new Error("Story not found");
    }

    return story;
  });
