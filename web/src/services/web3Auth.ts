import config from "@/config";
import { useLocalStorage } from "@vueuse/core";
import { watch } from "vue";
import Web3Token from "web3-token";
import { SignOpts } from "web3-token/lib/interfaces";
import { account, provider } from "./eth";

const storage = useLocalStorage<string | null>("web3Auth", null);

async function sign(signOpts: SignOpts): Promise<string> {
  if (!provider.value) throw new Error("No provider");

  const signer = provider.value!.getSigner();
  signOpts.chain_id ||= (await provider.value!.getNetwork()).chainId;

  const signature = await Web3Token.sign(
    async (msg: string) => await signer.signMessage(msg),
    signOpts
  );

  return signature;
}

let ensurePromise: Promise<string> | null = null;

export async function ensure(): Promise<string> {
  return (ensurePromise ||= (async () => {
    if (!storage.value) {
      storage.value = await sign({
        domain: import.meta.env.PROD ? config.trpcUrl.hostname : undefined,
        expires_in: 60 * 60 * 24 * 1000, // 1 day
      });
    } else {
      // TODO: Check expiration
    }

    ensurePromise = null;
    return storage.value!;
  })());
}

watch(account, () => {
  if (!account.value) storage.value = null;
});
