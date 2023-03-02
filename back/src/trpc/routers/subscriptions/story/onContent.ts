import { z } from "zod";
import { t } from "@/trpc/index";
import * as pg from "@/services/pg";
import { observable } from "@trpc/server/observable";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();

/**
 * Subscribe to new content in a story.
 */
export default t.procedure
  .input(z.object({ storyId: z.string() }))
  .subscription(async ({ input }) => {
    // Check that the user has access to the story.
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
      select: { userId: true },
    });

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
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
          storyId: string;
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
