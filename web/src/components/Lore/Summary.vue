<script setup lang="ts">
import Lore from "@/models/Lore";
import Jdenticon from "@/components/utility/Jdenticon.vue";
import { formatDistanceToNow } from "date-fns";
import { userId } from "@/store";

const { lore } = defineProps<{ lore: Lore }>();
</script>

<template lang="pug">
.flex.flex-col(class="gap-0.5")
  .flex.items-center.justify-between.gap-2
    span.shrink-0
      RouterLink.link-hover.text-lg.font-semibold.leading-tight(
        :to="'/lores/' + lore.id"
      ) {{ lore.name.value }}
      span.ml-1.font-light.italic.leading-tight.text-accent-500(
        v-if="lore.creatorId == userId && !lore.public_.value"
      ) (private)
    .w-full.bg-base-100(class="h-[1px]")
    span.shrink-0.leading-none.leading-tight.text-base-400(title="Lore id")
      span.select-none #
      span {{ lore.id }}

  p.text-sm.leading-tight {{ lore.about.value }}

  .mt-1.flex.flex-col
    span.text-xs.leading-none.text-base-500
      | Created by
      Jdenticon.mx-1.inline-block.h-4.rounded-full.border(
        :input="lore.creatorId"
      )
      span.font-medium {{ lore.creatorId }}
      span.italic.text-accent-500(v-if="lore.creatorId == userId") &nbsp;(you)&nbsp;
      | {{ formatDistanceToNow(lore.createdAt) }} ago
</template>
