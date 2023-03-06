import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";
import { lock } from "./shared";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(
    z.object({
      storyId: z.string(),
      charId: z.number(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const story = await prisma.story.findFirst({
      where: { id: input.storyId },
      select: {
        id: true,
        userId: true,
        charIds: true,
        userCharId: true,
      },
    });

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
    }

    if (story.userId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not your story" });
    }

    if (!story.charIds.includes(input.charId)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Character not in story",
      });
    }

    if (input.charId == story.userCharId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot remove main character",
      });
    }

    if (story.charIds.length <= 2) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot remove last character",
      });
    }

    const unlock = await lock(input.storyId);

    try {
      await prisma.story.update({
        where: { id: input.storyId },
        data: {
          charIds: story.charIds.filter((charId) => charId !== input.charId),
        },
      });
    } finally {
      unlock();
    }
  });
