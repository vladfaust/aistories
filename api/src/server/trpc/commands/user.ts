import { t } from "#trpc";

import settings from "./user/settings";
import me from "./user/me";

export default t.router({
  settings,
  me,
});
