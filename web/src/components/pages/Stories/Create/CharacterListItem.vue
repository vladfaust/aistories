<script setup lang="ts">
import Character from "@/models/Character";

const {
  character,
  selected,
  disabled = false,
} = defineProps<{
  character: Character;
  selected: boolean;
  disabled?: boolean;
}>();
</script>

<template lang="pug">
img.aspect-square.select-none.rounded.border.bg-base-50.object-contain.transition(
  :src="character.imagePreviewUrl.toString()"
  :class="disabled ? 'grayscale cursor-not-allowed opacity-40' : selected ? 'pressable cursor-pointer opacity-100 shadow-sm' : 'pressable cursor-pointer opacity-40 hover_opacity-100'"
)
</template>
