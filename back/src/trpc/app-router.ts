import { initTRPC } from "@trpc/server";
import { z } from "zod";
import * as ai from "@/ai";
import { Deferred } from "@/utils";

const t = initTRPC.create();

const router = t.router;
const publicProcedure = t.procedure;

export const appRouter = router({
  message: publicProcedure
    .input(z.string())
    .output(z.string())
    .query(async ({ input }) => {
      console.log("👤", input);

      const output = new Deferred<string>();

      ai.process.stdout.once("data", (data: Buffer) => {
        const response = data.toString().trim();
        console.log("🤖", response);
        output.resolve(response);
      });

      ai.process.stdin.write(`${input}\n`);

      return output.promise;
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
