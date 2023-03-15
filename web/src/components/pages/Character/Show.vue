<script setup lang="ts">
import Spinner2 from "@/components/utility/Spinner2.vue";
import Character from "@/models/Character";
import { Deferred } from "@/utils/deferred";
import LoreCard from "@/components/Lore/Card.vue";
import LoreSummary from "@/components/Lore/Summary.vue";
import CharCard from "@/components/Character/Card.vue";
import CharSummary from "@/components/Character/Summary.vue";
import { userId } from "@/store";
import nProgress from "nprogress";

const { character } = defineProps<{ character: Deferred<Character | null> }>();

await character.promise;

if (character.ref.value) {
  await character.ref.value.lore.promise;
  await character.ref.value.lore.ref.value!.loadCharacters();
}

nProgress.done();
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  template(v-if="character.ref.value")
    .flex.items-center.justify-between.gap-3
      .shrink-0.text-xl.font-medium Character
      template(v-if="character.ref.value.creatorId == userId")
        .w-full.bg-base-100(class="h-[1px]")
        RouterLink.btn.btn-sm.btn-primary.shrink-0(
          :to="'/chars/' + character.ref.value.id + '/edit'"
        ) Edit

    .grid.gap-3.sm_grid-cols-3
      CharCard.gap-2.rounded.border.p-2(
        v-if="character.ref.value"
        :char="character.ref.value"
      )
      .flex.flex-col.gap-2.sm_col-span-2
        CharSummary(:char="character.ref.value")
        RouterLink.btn.btn-primary.sm_w-max(
          v-if="character.ref.value.lore.ref.value"
          :to="'/story/new?loreId=' + character.ref.value.lore.ref.value.id + '&charId=' + character.ref.value.id"
        ) New story as {{ character.ref.value.name.value }} 📚

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

    .grid.grid-cols-2.gap-2.sm_grid-cols-5(
      v-if="character.ref.value.lore.ref.value"
    )
      template(
        v-for="char of character.ref.value.lore.ref.value.characters.value.filter((c) => c.ref.value?.id != character.ref.value?.id)"
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
