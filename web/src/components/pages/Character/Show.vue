<script setup lang="ts">
import Spinner2 from "@/components/utility/Spinner2.vue";
import Character from "@/models/Character";
import { Deferred } from "@/utils/deferred";
import {
  onMounted,
  onUnmounted,
  shallowRef,
  watch,
  type WatchStopHandle,
} from "vue";
import * as api from "@/services/api";
import LoreCard from "@/components/Lore/Card.vue";
import LoreSummary from "@/components/Lore/Summary.vue";
import CharCard from "@/components/Character/Card.vue";
import CharSummary from "@/components/Character/Summary.vue";

const { character } = defineProps<{ character: Deferred<Character | null> }>();
const fellowChars = shallowRef<Deferred<Character>[]>([]);

let watchStopHandle: WatchStopHandle | null = null;

onMounted(() => {
  watchStopHandle = watch(
    () => character.ref.value?.lore.ref.value,
    async (lore) => {
      if (lore) {
        fellowChars.value = (
          await api.trpc.commands.characters.filterByLore.query({
            loreId: lore.id,
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
  template(v-if="character.ref.value")
    .flex.items-center.justify-between.gap-3
      .shrink-0.text-xl.font-medium Character
      .w-full.bg-base-100(class="h-[1px]")
      RouterLink.btn.btn-sm.btn-primary.shrink-0(
        :to="'/chars/' + character.ref.value.id + '/edit'"
      ) Edit

    .grid.gap-3.sm_grid-cols-3
      CharCard.gap-2.rounded.border.p-2(
        v-if="character.ref.value"
        :char="character.ref.value"
      )
      CharSummary.sm_col-span-2(:char="character.ref.value")

    template(v-if="character.ref.value.lore.ref.value")
      h2.shrink-0.text-lg.font-medium Lore

      .grid.gap-3.sm_grid-cols-4(v-if="character.ref.value.lore.ref.value")
        LoreCard.gap-2.rounded.border.p-2(
          :key="character.ref.value.lore.ref.value.id"
          :lore="character.ref.value.lore.ref.value"
        )
        LoreSummary.hidden.sm_col-span-3.sm_block(
          :lore="character.ref.value.lore.ref.value"
        )

      .flex.items-center.justify-between.gap-3
        h2.shrink-0.font-medium Other lore characters
        .w-full.bg-base-100(class="h-[1px]")
        RouterLink.btn.btn-sm.btn-primary.shrink-0(
          :to="'/chars/new?loreId=' + character.ref.value.lore.ref.value.id"
        ) Create new ✨

    .grid.grid-cols-2.gap-2.sm_grid-cols-4
      template(
        v-for="char of fellowChars.filter((c) => c.ref.value?.id != character.ref.value?.id)"
        :key="char.ref.value?.id"
      )
        RouterLink.pressable.transition-transform(
          :to="'/chars/' + char.ref.value?.id"
        )
          CharCard.gap-2.rounded.border.p-2(
            v-if="char.ref.value"
            :char="char.ref.value"
          )
  template(v-else-if="character.ref.value == null")
    p Character not found.
  template(v-else)
    Spinner2
</template>
