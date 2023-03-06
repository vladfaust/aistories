import { t } from "#trpc";
import { z } from "zod";
import * as settings from "@/settings";

export default t.router({
  get: t.procedure
    .input(z.enum(["twitterLink", "discordLink"]))
    .output(z.string().nullable())
    .query(async ({ input }) => {
      return await settings.maybeGet(input);
    }),
});
