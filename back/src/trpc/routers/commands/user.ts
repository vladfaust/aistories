import { t } from "@/trpc/index";

import getEnergy from "./user/getEnergy";
import oAuth2LogIn from "./user/oAuth2LogIn";
import web3LogIn from "./user/web3LogIn";

export default t.router({
  getEnergy,
  oAuth2LogIn,
  web3LogIn,
});
