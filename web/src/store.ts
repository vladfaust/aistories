import { useLocalStorage } from "@vueuse/core";

export const energy = useLocalStorage("energy", 0);
export const web3Auth = useLocalStorage<string | null>("web3Auth", null);

export function clearStore() {
  web3Auth.value = null;
  energy.value = 0;
}
