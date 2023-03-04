<script setup lang="ts">
import Character from "@/models/Character";
const { character } = defineProps<{ character: Character }>();
</script>

<template lang="pug">
.flex.flex-col.gap-2.rounded.border.p-3.sm_flex-row
  img.aspect-square.rounded.border.bg-base-50.object-contain.sm_w-24(
    :src="character.imagePreviewUrl.toString()"
  )
  .flex.flex-col
    span.text-lg.font-bold.leading-tight {{ character.name }}
    span.text-sm.leading-tight.text-base-500 {{ character.title }}
    p.leading-tight {{ character.about }}
</template>
