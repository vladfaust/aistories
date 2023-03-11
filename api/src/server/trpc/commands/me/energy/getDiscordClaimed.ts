import { protectedProcedure } from "@/server/trpc/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { REASON } from "./claimDiscord";

const prisma = new PrismaClient();

export default protectedProcedure.output(z.boolean()).query(async ({ ctx }) => {
  const existingGrant = await prisma.energyGrant.findFirst({
    where: {
      userId: ctx.user.id,
      reason: REASON,
    },
    select: { id: true },
  });

  return !!existingGrant;
});
