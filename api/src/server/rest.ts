import { Router } from "express";
import auth from "./rest/auth";

const router: Router = Router().use("/auth", auth);

export default router;
