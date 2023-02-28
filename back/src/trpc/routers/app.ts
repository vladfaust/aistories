import t from "../index";

import character from "./character";
import settings from "./settings";
import story from "./story";
import user from "./user";

export const appRouter = t.router({
  character,
  settings,
  story,
  user,
});

export type AppRouter = typeof appRouter;
