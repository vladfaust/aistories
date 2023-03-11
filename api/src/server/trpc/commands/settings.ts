import { t } from "#trpc";
import { z } from "zod";
import * as settings from "@/settings";

import { GRANT_SETTING as DISCORD_GRANT_SETTING } from "#trpc/commands/me/energy/claimDiscord";

export default t.router({
  get: t.procedure
    .input(
      z.enum([
        "twitterLink",
        "discordLink",
        "energyWeb3ExchangeRate",
        "energyWeb3ExchangeMinValue",
        DISCORD_GRANT_SETTING,
      ])
    )
    .output(z.string().nullable())
    .query(async ({ input }) => {
      return await settings.maybeGet(input);
    }),
});
