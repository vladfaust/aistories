import { t } from "#trpc";

import addChar from "./story/addChar";
import advance from "./story/advance";
import create from "./story/create";
import find from "./story/find";
import getHistory from "./story/getHistory";
import list from "./story/list";
import removeChar from "./story/removeChar";
import setName from "./story/setName";

export default t.router({
  addChar,
  advance,
  create,
  find,
  getHistory,
  list,
  removeChar,
  setName,
});
