import * as dotenv from "dotenv";
import { random } from "nanoid";

dotenv.config();

class Server {
  constructor(
    readonly host: string,
    readonly port: number,
    readonly corsOrigin: string
  ) {}
}

class Jwt {
  constructor(readonly secret: Buffer) {}
}

class Discord {
  constructor(
    readonly clientId: string,
    readonly clientSecret: string,
    readonly redirectUri: string,
    readonly guildId: string
  ) {}
}

class Eth {
  constructor(
    readonly chainId: number,
    readonly httpRpcUrl: URL,
    readonly receiverAddress: string
  ) {}
}

class Config {
  readonly pid = Buffer.from(random(32));

  constructor(
    readonly prod: boolean,
    readonly databaseUrl: URL,
    readonly redisUrl: URL,
    readonly openAiApiKey: string,
    readonly server: Server,
    readonly jwt: Jwt,
    readonly discord: Discord,
    readonly eth: Eth
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
  requireEnv("OPENAI_API_KEY"),
  new Server(
    requireEnv("SERVER_HOST"),
    parseInt(requireEnv("SERVER_PORT")),
    requireEnv("SERVER_CORS_ORIGIN")
  ),
  new Jwt(Buffer.from(requireEnv("JWT_SECRET"))),
  new Discord(
    requireEnv("DISCORD_CLIENT_ID"),
    requireEnv("DISCORD_CLIENT_SECRET"),
    requireEnv("DISCORD_REDIRECT_URI"),
    requireEnv("DISCORD_GUILD_ID")
  ),
  new Eth(
    parseInt(requireEnv("ETH_CHAIN_ID")),
    new URL(requireEnv("ETH_HTTP_RPC_URL")),
    requireEnv("ETH_RECEIVER_ADDRESS")
  )
);

export default config;
