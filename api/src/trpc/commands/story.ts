import { t } from "@/trpc/index";

import advance from "./story/advance";
import create from "./story/create";
import find from "./story/find";
import getHistory from "./story/getHistory";
import list from "./story/list";

export default t.router({
  advance,
  create,
  find,
  getHistory,
  list,
});
