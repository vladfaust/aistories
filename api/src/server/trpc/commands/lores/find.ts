import t from "#trpc";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

/**
 * Find a lore by ID.
 */
export default t.procedure
  .input(z.object({ id: z.number() }))
  .query(async ({ ctx, input }) => {
    const lore = await prisma.lore.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        creatorId: true,
        public: true,
        name: true,
        about: true,
        setup: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!lore) return null;
    if (!lore.public && lore.creatorId !== ctx.user?.id) return null;

    if (lore.creatorId === ctx.user?.id) {
      return lore;
    } else {
      return {
        ...lore,
        setup: undefined,
      };
    }
  });
