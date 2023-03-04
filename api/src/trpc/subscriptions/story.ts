import { t } from "@/trpc/index";

import onContent from "./story/onContent";
import onBusy from "./story/onBusy";

export default t.router({
  onContent,
  onBusy,
});
