import t from "#trpc";
import { z } from "zod";

export default t.procedure
  .output(
    z
      .object({
        id: z.string(),
      })
      .nullable()
  )
  .query(async ({ ctx }) => {
    if (ctx.user) {
      return ctx.user;
    } else {
      return null;
    }
  });
