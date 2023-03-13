import { t } from "#trpc";

import create from "./lores/create";
import find from "./lores/find";
import getImageUploadUrl from "./lores/getImageUploadUrl";
import index from "./lores/index";
import update from "./lores/update";

export default t.router({
  create,
  find,
  getImageUploadUrl,
  index,
  update,
});
