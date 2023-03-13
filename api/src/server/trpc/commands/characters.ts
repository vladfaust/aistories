import { t } from "#trpc";

import create from "./characters/create";
import filterByLore from "./characters/filterByLore";
import find from "./characters/find";
import getImageUploadUrl from "./characters/getImageUploadUrl";
import index from "./characters/index";
import update from "./characters/update";

export default t.router({
  create,
  filterByLore,
  find,
  getImageUploadUrl,
  index,
  update,
});
