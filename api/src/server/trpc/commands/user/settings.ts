import { t } from "#trpc";

import get from "./settings/get";
import set from "./settings/set";

export default t.router({
  get,
  set,
});
