import { t } from "#trpc";

import energy from "./me/energy";
import getDiscord from "./me/getDiscord";
import getId from "./me/getId";
import settings from "./me/settings";

export default t.router({
  energy,
  getDiscord,
  getId,
  settings,
});
