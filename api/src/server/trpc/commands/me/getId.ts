import t from "#trpc";
import { z } from "zod";

/**
 * Returns id of the logged in user,
 * or null if no user is logged in.
 */
export default t.procedure
  .output(z.string().nullable())
  .query(async ({ ctx }) => {
    if (ctx.user) {
      return ctx.user.id;
    } else {
      return null;
    }
  });
