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

class Ethereum {
  constructor(readonly chainId: number, readonly httpRpcUrl: URL) {}
}

class Jwt {
  constructor(readonly secret: Buffer) {}
}

class Config {
  readonly pid = Buffer.from(random(32));

  constructor(
    readonly prod: boolean,
    readonly databaseUrl: URL,
    readonly redisUrl: URL,
    readonly offchainCafeEndpoint: URL,
    readonly openaiApiKey: string,
    readonly receiverAddress: string,
    readonly httpServer: HttpServer,
    readonly wsServer: WsServer,
    readonly eth: Ethereum,
    readonly jwt: Jwt
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
  new URL(requireEnv("OFFCHAIN_CAFE_ENDPOINT")),
  requireEnv("OPENAI_API_KEY"),
  requireEnv("RECEIVER_ADDRESS"),
  new HttpServer(
    requireEnv("HTTP_SERVER_HOST"),
    parseInt(requireEnv("HTTP_SERVER_PORT")),
    requireEnv("HTTP_SERVER_CORS_ORIGIN")
  ),
  new WsServer(
    requireEnv("WS_SERVER_HOST"),
    parseInt(requireEnv("WS_SERVER_PORT"))
  ),
  new Ethereum(
    parseInt(requireEnv("ETH_CHAIN_ID")),
    new URL(requireEnv("ETH_HTTP_RPC_URL"))
  ),
  new Jwt(Buffer.from(requireEnv("JWT_SECRET")))
);

export default config;
