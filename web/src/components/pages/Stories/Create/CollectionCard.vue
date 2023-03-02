<script setup lang="ts">
import Collection from "@/models/Collection";
const { collection } = defineProps<{ collection: Collection }>();
</script>

<template lang="pug">
.flex.flex-col.gap-2.rounded.border.p-3.sm_flex-row
  img.aspect-square.rounded.border.bg-base-50.object-contain.sm_w-32(
    :src="collection.imageUrl.toString()"
  )
  .flex.flex-col
    span.text-lg.font-bold.leading-tight {{ collection.name }}
    p.text-sm.leading-tight {{ collection.about }}
</template>
