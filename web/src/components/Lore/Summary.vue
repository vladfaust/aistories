<script setup lang="ts">
import Lore from "@/models/Lore";
const { lore } = defineProps<{ lore: Lore }>();
</script>

<template lang="pug">
.flex.flex-col
  .flex.items-center.justify-between.gap-2
    RouterLink.link-hover.shrink-0.text-lg.font-semibold(
      :to="'/lores/' + lore.id"
    ) {{ lore.name }}
    .w-full.bg-base-100(class="h-[1px]")
    span.shrink-0.text-base-400(title="Lore id")
      span.select-none #
      span {{ lore.id }}
  p.text-sm.leading-tight {{ lore.about }}
</template>
