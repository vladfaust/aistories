import { PrismaClient } from "@prisma/client";
import { protectedProcedure } from "@/trpc/middleware/auth";

const prisma = new PrismaClient();

/**
 * List the stories the user is a part of, and the latest content of each.
 */
export default protectedProcedure.query(async ({ ctx }) => {
  return prisma.story.findMany({
    where: {
      userIds: {
        has: ctx.user.id,
      },
    },
    select: {
      id: true,
      userIds: true,
      userMap: true,
      charIds: true,
      nextCharId: true,
      name: true,
      fabula: true,
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
