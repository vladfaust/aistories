import { t } from "#trpc";
import { z } from "zod";
import * as settings from "@/settings";

export default t.router({
  get: t.procedure
    .input(z.enum(["energyExchangeRate", "energyExchangeMinValue"]))
    .output(z.string())
    .query(async ({ input }) => {
      return await settings.get(input);
    }),
});