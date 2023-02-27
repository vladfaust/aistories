import { upsertUser } from "@/trpc/context";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { t } from "../../index";

const prisma = new PrismaClient();

/**
 * List the stories the user is a part of,
 * and the latest content of each.
 */
export default t.procedure
  .input(
    z.object({
      authToken: z.string(),
    })
  )
  .query(async ({ input }) => {
    const inputAuth = await upsertUser(input.authToken);

    return prisma.story.findMany({
      where: {
        userIds: {
          has: inputAuth.id,
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
