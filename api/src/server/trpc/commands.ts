import t from "#trpc";

import character from "./commands/character";
import collections from "./commands/collections";
import me from "./commands/me";
import settings from "./commands/settings";
import story from "./commands/story";

export const commandsRouter = t.router({
  character,
  collections,
  settings,
  me,
  story,
});

export type CommandsRouter = typeof commandsRouter;
