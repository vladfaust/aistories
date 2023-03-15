import t from "#trpc";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Returns a list of all lore IDs.
 */
export default t.procedure.query(async ({ ctx }) => {
  if (ctx.user) {
    return (
      await prisma.lore.findMany({
        where: {
          id: { gt: 0 },
          OR: [{ public: true }, { creatorId: ctx.user.id }],
        },
        select: { id: true },
        orderBy: { id: "asc" },
      })
    ).map((l) => l.id);
  } else {
    return (
      await prisma.lore.findMany({
        where: {
          id: { gt: 0 },
          public: true,
        },
        select: { id: true },
        orderBy: { id: "asc" },
      })
    ).map((l) => l.id);
  }
});
