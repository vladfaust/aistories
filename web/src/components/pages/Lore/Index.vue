<!-- TODO: Embark new story with this lore. -->

<script setup lang="ts">
import Lore from "@/models/Lore";
import * as api from "@/services/api";
import { Deferred } from "@/utils/deferred";
import { shallowRef } from "vue";
import LoreCard from "@/components/Lore/Card.vue";
import nProgress from "nprogress";

const lores = shallowRef<Deferred<Lore>[]>([]);

lores.value = (await api.trpc.commands.lores.index.query()).map(
  (lore) => Lore.findOrCreate(lore) as Deferred<Lore>
);

nProgress.done();
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  .flex.items-center.justify-between.gap-3
    .shrink-0.text-xl.font-medium.leading-none(to="/lore") Lores
    .w-full.bg-base-100(class="h-[1px]")
    RouterLink.btn.btn-sm.btn-primary.shrink-0(:to="'/lores/new'") Create new ✨

  .grid.grid-cols-4.gap-2
    template(v-for="lore in lores")
      LoreCard.gap-2.rounded.border.p-2(
        v-if="lore.ref.value"
        :key="lore.ref.value?.id"
        :lore="lore.ref.value"
      )
</template>
