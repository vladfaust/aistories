<script setup lang="ts">
import { type Character } from "@/models/Character";

const { char } = defineProps<{
  char: Character;
}>();
</script>

<template lang="pug">
.flex
  img.aspect-square.w-32.rounded.object-contain(:src="char.imagePreviewUrl")
  .flex.flex-col.gap-2
    span.text-xl.font-semibold.leading-none {{ char.name }}
    p.leading-tight {{ char.about }}
    .flex
      router-link.btn.btn-primary.leading-none(:to="'/chat/' + char.id") Go to page
</template>
