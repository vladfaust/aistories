<script setup lang="ts">
import Character from "@/models/Character";
import * as api from "@/services/api";
import { Deferred } from "@/utils/deferred";
import { shallowRef } from "vue";
import CharCard from "@/components/Character/Card.vue";
import nProgress from "nprogress";

const characters = shallowRef<Deferred<Character>[]>([]);

characters.value = (await api.trpc.commands.characters.index.query()).map(
  (lore) => Character.findOrCreate(lore) as Deferred<Character>
);

nProgress.done();
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  .flex.items-center.justify-between.gap-3
    .shrink-0.text-xl.font-medium.leading-none Characters
    .w-full.bg-base-100(class="h-[1px]")
    button.btn.btn-sm.btn-primary.shrink-0 Create new ✨

  .grid.grid-cols-2.gap-2.sm_grid-cols-5
    template(v-for="char in characters" :key="char.ref.value?.id")
      CharCard.gap-2.rounded.border.p-2(
        v-if="char.ref.value"
        :char="char.ref.value"
      )
</template>
