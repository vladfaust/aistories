import { useSessionStorage } from "@vueuse/core";

export const userId = useSessionStorage<string | null>("userId", null);
