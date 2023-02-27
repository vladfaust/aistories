import { t } from "../index";

import addContent from "./story/addContent";
import create from "./story/create";
import find from "./story/find";
import getHistory from "./story/getHistory";
import list from "./story/list";
import onContent from "./story/onContent";
import onContentToken from "./story/onContentToken";
import onTurn from "./story/onTurn";

export default t.router({
  addContent,
  create,
  find,
  getHistory,
  list,
  onContent,
  onContentToken,
  onTurn,
});
