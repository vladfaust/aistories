import * as dotenv from "dotenv";

dotenv.config();

class Server {
  constructor(readonly host: string, readonly port: number) {}
}

class Ethereum {
  constructor(readonly chainId: number, readonly httpRpcUrl: URL) {}
}

class Config {
  constructor(
    readonly prod: boolean,
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
  new Server(requireEnv("SERVER_HOST"), parseInt(requireEnv("SERVER_PORT"))),
  new Ethereum(
    parseInt(requireEnv("ETH_CHAIN_ID")),
    new URL(requireEnv("ETH_HTTP_RPC_URL"))
  )
);

export default config;
