import { initTRPC } from "@trpc/server";
import { Context } from "./trpc/context";

export const t = initTRPC.context<Context>().create();
export default t;
