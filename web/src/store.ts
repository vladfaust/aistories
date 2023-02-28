import { useLocalStorage } from "@vueuse/core";
import { cleanup as web3AuthCleanup } from "@/services/web3Auth";

export const energy = useLocalStorage("energy", 0);
export const web3Auth = useLocalStorage<string | null>("web3Auth", null);

export function clearStore() {
  web3Auth.value = null;
  web3AuthCleanup(); // REFACTOR:
  energy.value = 0;
}
