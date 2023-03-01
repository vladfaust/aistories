import { t } from "@/trpc/index";

import getEnergy from "./user/getEnergy";
import web3LogIn from "./user/web3LogIn";

export default t.router({
  getEnergy,
  web3LogIn,
});
