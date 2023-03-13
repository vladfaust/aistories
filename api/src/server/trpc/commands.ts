import t from "#trpc";

import characters from "./commands/characters";
import lores from "./commands/lores";
import me from "./commands/me";
import settings from "./commands/settings";
import story from "./commands/story";

export const commandsRouter = t.router({
  characters,
  lores,
  settings,
  me,
  story,
});

export type CommandsRouter = typeof commandsRouter;
