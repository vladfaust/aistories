import { t } from "#trpc";

import onContent from "./story/onContent";
import onStatus from "./story/onStatus";

export default t.router({
  onContent,
  onStatus,
});
