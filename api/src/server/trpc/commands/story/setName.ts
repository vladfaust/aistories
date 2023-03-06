import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { protectedProcedure } from "#trpc/middleware/auth";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();

export default protectedProcedure
  .input(
    z.object({
      storyId: z.string(),
      name: z.string().nullable(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const story = await prisma.story.findFirst({
      where: { id: input.storyId },
      select: { id: true, userId: true, charIds: true },
    });

    if (!story) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
    }

    if (story.userId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not your story" });
    }

    await prisma.story.update({
      where: { id: input.storyId },
      data: { name: input.name },
    });
  });
