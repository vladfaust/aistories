import { z } from "zod";
import * as pg from "@/services/pg";
import { observable } from "@trpc/server/observable";
import { PrismaClient } from "@prisma/client";
import { protectedProcedure } from "@/trpc/middleware/auth";

const prisma = new PrismaClient();

/**
 * Subscribe to new content in a story.
 */
export default protectedProcedure
  .input(
    z.object({
      storyId: z.number().positive(),
    })
  )
  .subscription(async ({ ctx, input }) => {
    // Check that the user has access to the story.
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
      select: { userId: true },
    });

    if (!story || story.userId !== ctx.user.id) {
      throw new Error("Story not found");
    }

    return observable<{
      id: number;
      charId: number;
      content: string;
      createdAt: Date;
    }>((emit) => {
      const cancel = pg.listen("StoryContentInsert", async (payload: any) => {
        const message = JSON.parse(payload) satisfies {
          id: number;
          storyId: number;
          charId: number;
          content: string;
          createdAt: string; // Timestamp
        };

        if (message.storyId != input.storyId) return;

        emit.next({
          id: message.id,
          charId: message.charId,
          content: message.content,
          createdAt: new Date(Date.parse(message.createdAt)),
        });
      });

      return () => {
        cancel.then((cancel) => cancel());
      };
    });
  });
