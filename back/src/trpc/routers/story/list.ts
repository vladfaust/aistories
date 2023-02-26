import { upsertUser } from "@/trpc/context";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { t } from "../../index";

const prisma = new PrismaClient();

/**
 * List the stories created by a user.
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
        userId: inputAuth.id,
      },
      select: {
        id: true,
        userId: true,
        characterId: true,
        name: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  });
