import config from "@/config";
import pg from "pg";

export const pool = new pg.Pool({
  host: config.databaseUrl.hostname,
  user: config.databaseUrl.username ? config.databaseUrl.username : undefined,
  password: config.databaseUrl.password
    ? config.databaseUrl.password
    : undefined,
  database: config.databaseUrl.pathname.slice(1),
  port: config.databaseUrl.port ? parseInt(config.databaseUrl.port) : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * @returns Cancel function
 */
export async function listen(
  notificationChannel: string,
  onPayload: (payload: any) => void
): Promise<() => void> {
  const client = await pool.connect();

  client.on("notification", async (msg: any) => {
    if (msg.channel == notificationChannel) {
      onPayload(msg.payload);
    }
  });

  client.query(`LISTEN "${notificationChannel}"`);

  return () => {
    client.query(`UNLISTEN "${notificationChannel}"`);
    client.release();
  };
}

/**
 * @param byteaString E.g. "\\xa3bb..."
 */
export function byteaStringToBuffer(byteaString: string): Buffer {
  return Buffer.from(byteaString.slice(2), "hex");
}
