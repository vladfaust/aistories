<!-- TODO: Embark new story with this lore. -->

<script setup lang="ts">
import Lore from "@/models/Lore";
import * as api from "@/services/api";
import { Deferred } from "@/utils/deferred";
import { shallowRef } from "vue";
import CharCard from "@/components/Character/Card.vue";
import LoreCard from "@/components/Lore/Card.vue";
import LoreSummary from "@/components/Lore/Summary.vue";
import nProgress from "nprogress";
import { tap } from "@/utils";

const lores = shallowRef<Deferred<Lore>[]>([]);

lores.value = (await api.trpc.commands.lores.index.query()).map((lore) =>
  tap(Lore.findOrCreate(lore) as Deferred<Lore>, (deferred) =>
    deferred.promise.then((lore) => lore.loadCharacters())
  )
);

nProgress.done();
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  .flex.items-center.justify-between.gap-3
    .shrink-0.text-xl.font-medium.leading-none(to="/lore") Lores
    .w-full.bg-base-100(class="h-[1px]")
    RouterLink.btn.btn-sm.btn-primary.shrink-0(:to="'/lores/new'") Create new ✨

  .flex.flex-col.gap-3
    .grid.gap-3.rounded.border.p-3.sm_grid-cols-4(v-for="lore in lores")
      template(v-if="lore.ref.value")
        LoreCard.h-max.gap-2.rounded.border.p-2(
          :key="lore.ref.value?.id"
          :lore="lore.ref.value"
        )
        .col-span-3.flex.max-h-full.flex-col.gap-2.overflow-x-auto
          LoreSummary.w-full(
            v-if="lore.ref.value"
            :key="lore.ref.value.id"
            :lore="lore.ref.value"
          )
          .flex.gap-2.overflow-x-auto
            template(v-for="char of lore.ref.value.characters.value")
              CharCard.shrink-0.gap-2.rounded.border.p-2(
                v-if="char.ref.value"
                :char="char.ref.value"
                style="width: calc(25%)"
              )
</template>
