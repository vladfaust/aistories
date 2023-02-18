class Config {
  constructor(readonly trpcUrl: URL) {}
}

function requireEnv(id: string): string {
  if (import.meta.env[id]) return import.meta.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(new URL(requireEnv("VITE_TRPC_URL")));

export default config;
