import { TRPCError } from "@trpc/server";
import { t } from "../../trpc";

const reqUser = t.middleware(({ next, ctx }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

/**
 * Requires the user to be authenticated.
 */
export const protectedProcedure = t.procedure.use(reqUser);
