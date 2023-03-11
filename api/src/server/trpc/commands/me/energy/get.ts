import { protectedProcedure } from "@/server/trpc/middleware/auth";
import { z } from "zod";
import * as energy from "@/logic/energy";

/**
 * Returns energy of the logged in user.
 */
export default protectedProcedure.output(z.number()).query(async ({ ctx }) => {
  return await energy.getBalance(ctx.user.id);
});
