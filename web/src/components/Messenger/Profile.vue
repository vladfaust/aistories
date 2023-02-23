<script setup lang="ts">
import { Character } from "@/models/Character";

const { character } = defineProps<{
  character: Character;
}>();
</script>

<template lang="pug">
.flex.flex-col.items-center.gap-4.p-8
  img.aspect-square.w-full.rounded-full.bg-base-50(
    :src="character.imagePreviewUrl.toString()"
  )
  .flex.flex-col.items-center(class="gap-1.5")
    span.text-lg.font-bold.leading-none {{ character.name }}
    span.leading-none.text-base-500 {{ character.title }}
    p.text-justify.text-sm.leading-tight {{ character.about }}
</template>
