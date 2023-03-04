import * as dotenv from "dotenv";
import { random } from "nanoid";

dotenv.config();

class HttpServer {
  constructor(
    readonly host: string,
    readonly port: number,
    readonly corsOrigin: string
  ) {}
}

class WsServer {
  constructor(readonly host: string, readonly port: number) {}
}

class Jwt {
  constructor(readonly secret: Buffer) {}
}

class Discord {
  constructor(readonly clientSecret: string) {}
}

class Config {
  readonly pid = Buffer.from(random(32));

  constructor(
    readonly prod: boolean,
    readonly databaseUrl: URL,
    readonly redisUrl: URL,
    readonly httpServer: HttpServer,
    readonly wsServer: WsServer,
    readonly jwt: Jwt,
    readonly discord: Discord
  ) {}
}

function requireEnv(id: string): string {
  if (process.env[id]) return process.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(
  process.env.NODE_ENV === "production",
  new URL(requireEnv("DATABASE_URL")),
  new URL(requireEnv("REDIS_URL")),
  new HttpServer(
    requireEnv("HTTP_SERVER_HOST"),
    parseInt(requireEnv("HTTP_SERVER_PORT")),
    requireEnv("HTTP_SERVER_CORS_ORIGIN")
  ),
  new WsServer(
    requireEnv("WS_SERVER_HOST"),
    parseInt(requireEnv("WS_SERVER_PORT"))
  ),
  new Jwt(Buffer.from(requireEnv("JWT_SECRET"))),
  new Discord(requireEnv("DISCORD_CLIENT_SECRET"))
);

export default config;
