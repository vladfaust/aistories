import { useLocalStorage } from "@vueuse/core";
import { computed, ComputedRef } from "vue";

export const energy = useLocalStorage("energy", 0);
export const jwt = useLocalStorage<string | null>("jwt", null);
export const userId: ComputedRef<number | null> = computed(() =>
  jwt.value ? JSON.parse(atob(jwt.value!.split(".")[1])).uid : null
);

export function clearStore() {
  jwt.value = null;
  energy.value = 0;
}
