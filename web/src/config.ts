export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
  txConfirmations: number;
  blockTime: number;
}

class Eth {
  constructor(
    readonly chain: AddEthereumChainParameter,
    readonly receiverAddress: string
  ) {}
}

class Config {
  constructor(
    readonly restApiUrl: URL,
    readonly trpcHttpUrl: URL,
    readonly trpcWsUrl: URL,
    readonly discordClientId: string,
    readonly discordRedirectUri: string,
    readonly cdnUrl: URL,
    readonly eth: Eth
  ) {}
}

function requireEnv(id: string): string {
  if (import.meta.env[id]) return import.meta.env[id]!;
  else throw `Missing env var ${id}`;
}

const config = new Config(
  new URL(requireEnv("VITE_REST_API_URL")),
  new URL(requireEnv("VITE_TRPC_HTTP_URL")),
  new URL(requireEnv("VITE_TRPC_WS_URL")),
  requireEnv("VITE_DISCORD_CLIENT_ID"),
  requireEnv("VITE_DISCORD_REDIRECT_URI"),
  new URL(requireEnv("VITE_CDN_URL")),
  new Eth(
    JSON.parse(requireEnv("VITE_ETH_CHAIN")),
    requireEnv("VITE_ETH_RECEIVER_ADDRESS")
  )
);

export default config;
