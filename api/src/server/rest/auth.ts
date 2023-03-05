import { Router } from "express";
import authProviderCallback from "./auth/provider/callback";
import authClear from "./auth/clear";

const router: Router = Router()
  .get("/:provider/callback", authProviderCallback)
  .delete("/clear", authClear);

export default router;
