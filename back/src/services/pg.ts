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
