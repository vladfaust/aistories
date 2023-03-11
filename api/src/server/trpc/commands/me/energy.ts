import { t } from "#trpc";

import claim from "./energy/claim";
import get from "./energy/get";

export default t.router({
  claim,
  get,
});
