import { protectedProcedure } from "@/trpc/middleware/auth";
import { getEnergyBalance } from "@/logic/getEnergyBalance";

/**
 * Get the current energy balance.
 */
export default protectedProcedure.query(async ({ ctx, input }) => {
  return { energy: await getEnergyBalance(ctx.user.id) };
});
