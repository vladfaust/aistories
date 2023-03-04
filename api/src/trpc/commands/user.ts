import { t } from "@/trpc/index";

import oAuth2LogIn from "./user/oAuth2LogIn";
import settings from "./user/settings";

export default t.router({
  oAuth2LogIn,
  settings,
});
