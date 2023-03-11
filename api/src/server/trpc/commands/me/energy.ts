import { t } from "#trpc";

import claimDiscord from "./energy/claimDiscord";
import claimWeb3 from "./energy/claimWeb3";
import get from "./energy/get";
import getDiscordClaimed from "./energy/getDiscordClaimed";

export default t.router({
  claimDiscord,
  claimWeb3,
  get,
  getDiscordClaimed,
});
