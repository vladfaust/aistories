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

class S3 {
  constructor(
    readonly accessKeyId: string,
    readonly secretAccessKey: string,
    readonly endpoint: URL,
    readonly region: string,
    readonly bucket: string
  ) {}
}

class Sentry {
  constructor(
    readonly dsn: string,
    readonly debug?: boolean,
    readonly environment?: string
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
    readonly eth: Eth,
    readonly s3: S3,
    readonly sentry?: Sentry
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
  ),
  new S3(
    requireEnv("S3_ACCESS_KEY_ID"),
    requireEnv("S3_SECRET_ACCESS_KEY"),
    new URL(requireEnv("S3_ENDPOINT")),
    requireEnv("S3_REGION"),
    requireEnv("S3_BUCKET")
  ),
  process.env.SENTRY_DSN
    ? new Sentry(
        requireEnv("SENTRY_DSN"),
        process.env.SENTRY_DEBUG !== undefined
          ? process.env.SENTRY_DEBUG === "true"
          : undefined,
        process.env.SENTRY_ENVIRONMENT
      )
    : undefined
);

export default config;
