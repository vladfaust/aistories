import * as dotenv from "dotenv";
import { random } from "nanoid";

dotenv.config();

class Server {
  constructor(readonly host: string, readonly port: number) {}
}

class Ethereum {
  constructor(readonly chainId: number, readonly httpRpcUrl: URL) {}
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
    readonly server: Server,
    readonly eth: Ethereum
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
  new Server(requireEnv("SERVER_HOST"), parseInt(requireEnv("SERVER_PORT"))),
  new Ethereum(
    parseInt(requireEnv("ETH_CHAIN_ID")),
    new URL(requireEnv("ETH_HTTP_RPC_URL"))
  )
);

export default config;
