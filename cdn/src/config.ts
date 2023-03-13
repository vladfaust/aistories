import * as dotenv from "dotenv";

dotenv.config();

class Server {
  constructor(readonly host: string, readonly port: number) {}
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

class Config {
  constructor(readonly server: Server, readonly s3: S3) {}
}

function requireEnv(id: string): string {
  if (process.env[id]) return process.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(
  new Server(requireEnv("SERVER_HOST"), parseInt(requireEnv("SERVER_PORT"))),
  new S3(
    requireEnv("S3_ACCESS_KEY_ID"),
    requireEnv("S3_SECRET_ACCESS_KEY"),
    new URL(requireEnv("S3_ENDPOINT")),
    requireEnv("S3_REGION"),
    requireEnv("S3_BUCKET")
  )
);

export default config;
