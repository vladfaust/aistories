import config from "@/config.js";
import { Redis } from "ioredis";

export const prefix = config.redisUrl.searchParams.get("prefix");

export function client() {
  return new Redis(config.redisUrl.toString());
}

export default client();
