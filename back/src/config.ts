import * as dotenv from "dotenv";

dotenv.config();

class Server {
  constructor(readonly host: string, readonly port: number) {}
}

class Config {
  constructor(readonly server: Server) {}
}

function requireEnv(id: string): string {
  if (process.env[id]) return process.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(
  new Server(requireEnv("SERVER_HOST"), parseInt(requireEnv("SERVER_PORT")))
);

export default config;
