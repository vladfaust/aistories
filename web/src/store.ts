import { useSessionStorage } from "@vueuse/core";

export const userId = useSessionStorage<string | null>("userId", null);
export const web3Token = useSessionStorage<string | null>("web3Token", null);
export const energy = useSessionStorage<number>("energy", 0);
