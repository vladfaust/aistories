import { t } from "@/trpc/index";

import oAuth2LogIn from "./user/oAuth2LogIn";
import settings from "./user/settings";
import web3LogIn from "./user/web3LogIn";

export default t.router({
  oAuth2LogIn,
  settings,
  web3LogIn,
});
