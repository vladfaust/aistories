import { PrismaClient } from "@prisma/client";
import { protectedProcedure } from "#trpc/middleware/auth";

const prisma = new PrismaClient();

/**
 * List the stories the user is a part of, and the latest content of each.
 */
export default protectedProcedure.query(async ({ ctx }) => {
  return prisma.story.findMany({
    where: { userId: ctx.user.id },
    select: {
      id: true,
      collectionId: true,
      userId: true,
      userCharId: true,
      charIds: true,
      name: true,
      fabula: true,
      reason: true,
      createdAt: true,
      updatedAt: true,
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
    orderBy: {
      createdAt: "desc",
    },
  });
});
