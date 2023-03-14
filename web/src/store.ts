import { useSessionStorage } from "@vueuse/core";
import Web3Token from "web3-token";
import * as eth from "@/services/eth";
import config from "@/config";

export const userId = useSessionStorage<string | null>("userId", null);
export const web3Token = useSessionStorage<string | null>("web3Token", null);
export const energy = useSessionStorage<number>("energy", 0);

export async function ensureWeb3Token(): Promise<string> {
  if (!eth.provider.value) {
    throw new Error("You must be connected to Ethereum to sign requests");
  }

  if (!web3Token.value) {
    web3Token.value = await Web3Token.sign(
      async (msg: string) => eth.provider.value!.getSigner().signMessage(msg),
      {
        domain: import.meta.env.PROD ? config.trpcHttpUrl.hostname : undefined,
        expires_in: 60 * 60 * 24 * 1000, // 1 day
      }
    );
  }

  return web3Token.value!;
}
