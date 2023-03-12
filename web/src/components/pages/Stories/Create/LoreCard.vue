<script setup lang="ts">
import Lore from "@/models/Lore";
const { lore } = defineProps<{ lore: Lore }>();
</script>

<template lang="pug">
.flex.flex-col.gap-3.rounded.border.p-3.sm_flex-row
  img.aspect-square.w-48.rounded.border.bg-base-50.object-contain.sm_w-32(
    :src="lore.imageUrl.toString()"
  )
  .flex.flex-col
    span.text-lg.font-bold.leading-tight {{ lore.name }}
    p.text-sm.leading-tight {{ lore.about }}
</template>
