class Config {
  constructor(readonly trpcUrl: URL, readonly receiverAddress: string) {}
}

function requireEnv(id: string): string {
  if (import.meta.env[id]) return import.meta.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(
  new URL(requireEnv("VITE_TRPC_URL")),
  requireEnv("VITE_RECEIVER_ADDRESS")
);

export default config;
