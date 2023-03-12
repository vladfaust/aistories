<script setup lang="ts">
import Spinner2 from "@/components/utility/Spinner2.vue";
import Character from "@/models/Character";
import Lore from "@/models/Lore";
import { Deferred } from "@/utils/deferred";
import {
  onMounted,
  onUnmounted,
  shallowRef,
  watch,
  type WatchStopHandle,
} from "vue";
import * as api from "@/services/api";
import LoreSummary from "@/components/Lore/Summary.vue";
import LoreCard from "@/components/Lore/Card.vue";
import CharCard from "@/components/Character/Card.vue";

const { lore } = defineProps<{ lore: Deferred<Lore | null> }>();
const characters = shallowRef<Deferred<Character>[]>([]);

let watchStopHandle: WatchStopHandle | null = null;

onMounted(() => {
  watchStopHandle = watch(
    () => lore.ref.value,
    async (newLore) => {
      if (newLore) {
        characters.value = (
          await api.trpc.commands.character.filterByLore.query({
            loreId: newLore.id,
          })
        ).map((id) => Character.findOrCreate(id) as Deferred<Character>);
      }
    },
    { immediate: true }
  );
});

onUnmounted(() => {
  watchStopHandle?.();
});
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  template(v-if="lore.ref.value")
    .flex.items-center.justify-between.gap-3
      .shrink-0.text-xl.font-medium Lore
      .w-full.bg-base-100(class="h-[1px]")
      button.btn.btn-sm.btn-primary.shrink-0 Edit

    .grid.grid-cols-3.gap-3
      LoreCard.gap-2.rounded.border.p-3(:lore="lore.ref.value")
      LoreSummary.col-span-2(:lore="lore.ref.value")

    .flex.items-center.justify-between.gap-3
      h2.shrink-0.text-lg.font-medium Lore characters
      .w-full.bg-base-100(class="h-[1px]")
      button.btn.btn-sm.btn-primary.shrink-0 Create new ✨

    .grid.grid-cols-5.gap-3
      template(v-for="char in characters" :key="char.ref.value?.id")
        RouterLink.pressable.transition-transform(
          :to="'/chars/' + char.ref.value?.id"
        )
          CharCard.pressable.gap-2.rounded.border.p-3.transition-transform.transition-transform(
            v-if="char.ref.value"
            :char="char.ref.value"
          )
  template(v-else-if="lore.ref.value == null")
    p Lore not found.
  template(v-else)
    Spinner2
</template>
