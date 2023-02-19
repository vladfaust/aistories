import * as dotenv from "dotenv";

dotenv.config();

class Server {
  constructor(readonly host: string, readonly port: number) {}
}

class ElevenLabs {
  constructor(readonly baseUrl: URL, readonly apiKey: string) {}
}

class Config {
  constructor(
    readonly prod: boolean,
    readonly server: Server,
    readonly elevenLabs: ElevenLabs
  ) {}
}

function requireEnv(id: string): string {
  if (process.env[id]) return process.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(
  process.env.NODE_ENV === "production",
  new Server(requireEnv("SERVER_HOST"), parseInt(requireEnv("SERVER_PORT"))),
  new ElevenLabs(
    new URL(requireEnv("ELEVEN_LABS_BASE_URL")),
    requireEnv("ELEVEN_LABS_API_KEY")
  )
);

export default config;
