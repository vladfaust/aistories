import config from "@/config.js";
import { Redis } from "ioredis";

export const prefix = config.redisUrl.searchParams.get("prefix");

export function client() {
  return new Redis(config.redisUrl.toString());
}

export default client();

export async function get(key: string): Promise<string | null> {
  return await client().get(`${prefix}:${key}`);
}

export async function set(key: string, value: string): Promise<void> {
  await client().set(`${prefix}:${key}`, value);
}

export async function del(key: string): Promise<void> {
  await client().del(`${prefix}:${key}`);
}

export async function cachedOr(
  key: string,
  onMiss: () => Promise<string>
): Promise<string> {
  const cached = await get(key);
  if (cached) return cached;

  const result = await onMiss();
  await set(key, result);

  return result;
}
