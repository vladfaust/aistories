<script setup lang="ts">
import Spinner2 from "@/components/utility/Spinner2.vue";
import Character from "@/models/Character";
import Lore from "@/models/Lore";
import { Deferred } from "@/utils/deferred";
import { shallowRef } from "vue";
import * as api from "@/services/api";
import LoreSummary from "@/components/Lore/Summary.vue";
import LoreCard from "@/components/Lore/Card.vue";
import CharCard from "@/components/Character/Card.vue";
import { userId } from "@/store";
import nProgress from "nprogress";

const { lore } = defineProps<{ lore: Deferred<Lore | null> }>();
const characters = shallowRef<Deferred<Character>[]>([]);

await lore.promise;

if (lore.ref.value) {
  characters.value = (
    await api.trpc.commands.characters.filterByLore.query({
      loreId: lore.ref.value.id,
    })
  ).map((id) => Character.findOrCreate(id) as Deferred<Character>);
}

nProgress.done();
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  template(v-if="lore.ref.value")
    .flex.items-center.justify-between.gap-3
      .shrink-0.text-xl.font-medium Lore
      template(v-if="lore.ref.value.creatorId == userId")
        .w-full.bg-base-100(class="h-[1px]")
        RouterLink.btn.btn-sm.btn-primary.shrink-0(
          :to="'/lores/' + lore.ref.value.id + '/edit'"
        ) Edit

    .grid.gap-3.sm_grid-cols-3
      LoreCard.gap-2.rounded.border.p-2(:lore="lore.ref.value")
      LoreSummary.sm_col-span-2(:lore="lore.ref.value")

    .flex.items-center.justify-between.gap-3
      h2.shrink-0.text-lg.font-medium Lore characters
      .w-full.bg-base-100(class="h-[1px]")
      RouterLink.btn.btn-sm.btn-primary.shrink-0(
        :to="'/chars/new?loreId=' + lore.ref.value.id"
      ) Create new ✨

    .grid.grid-cols-2.gap-2.sm_grid-cols-4
      template(v-for="char in characters" :key="char.ref.value?.id")
        RouterLink.pressable.transition-transform(
          :to="'/chars/' + char.ref.value?.id"
        )
          CharCard.pressable.gap-2.rounded.border.p-2.transition-transform.transition-transform(
            v-if="char.ref.value"
            :char="char.ref.value"
          )
  template(v-else-if="lore.ref.value == null")
    p Lore not found.
  template(v-else)
    Spinner2
</template>
