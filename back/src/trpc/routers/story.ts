import { t } from "../index";

import create from "./story/create";
import find from "./story/find";
import getHistory from "./story/getHistory";
import list from "./story/list";
import onMessage from "./story/onMessage";
import onMessageToken from "./story/onMessageToken";
import sendMessage from "./story/sendMessage";

export default t.router({
  create,
  find,
  getHistory,
  list,
  onMessage,
  onMessageToken,
  sendMessage,
});
