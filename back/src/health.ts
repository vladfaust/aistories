import * as redis from "@/services/redis";
import config from "@/config";
import { sleep } from "@/utils";

export const INTERVAL = 5000; // 5 seconds

/**
 * Heartbeat to keep the process alive.
 * @param period in seconds
 */
export async function heartbeat() {
  while (true) {
    await redis.default.set(
      redis.prefix + `pid:${config.pid}`,
      "ok",
      "EX",
      INTERVAL / 1000
    );

    await sleep(INTERVAL / 2);
  }
}

/**
 * Check if the process is alive.
 */
export async function check(pid: Buffer): Promise<boolean> {
  const value = await redis.default.get(redis.prefix + `pid:${pid}`);
  return value === "ok";
}
