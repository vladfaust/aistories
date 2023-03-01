import { t } from "@/trpc/index";

import addContent from "./story/addContent";
import create from "./story/create";
import find from "./story/find";
import getHistory from "./story/getHistory";
import list from "./story/list";

export default t.router({
  addContent,
  create,
  find,
  getHistory,
  list,
});
