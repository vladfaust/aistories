class Config {
  constructor(
    readonly trpcHttpUrl: URL,
    readonly trpcWsUrl: URL,
    readonly receiverAddress: string,
    readonly discordClientId: string,
    readonly discordRedirectUri: string
  ) {}
}

function requireEnv(id: string): string {
  if (import.meta.env[id]) return import.meta.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(
  new URL(requireEnv("VITE_TRPC_HTTP_URL")),
  new URL(requireEnv("VITE_TRPC_WS_URL")),
  requireEnv("VITE_RECEIVER_ADDRESS"),
  requireEnv("VITE_DISCORD_CLIENT_ID"),
  requireEnv("VITE_DISCORD_REDIRECT_URI")
);

export default config;
