import { t } from "@/trpc/index";

import onContent from "./story/onContent";
import onContentToken from "./story/onContentToken";
import onTurn from "./story/onTurn";

export default t.router({
  onContent,
  onContentToken,
  onTurn,
});
