<script setup lang="ts">
import Character from "@/models/Character";
import { LockClosedIcon } from "@heroicons/vue/24/outline";
import { computed } from "vue";

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
template(v-if="character.collected.value")
  img.aspect-square.select-none.rounded.bg-base-50.object-contain.transition(
    :src="character.imagePreviewUrl.toString()"
    :class="disabled ? 'grayscale cursor-not-allowed opacity-40' : selected ? 'pressable cursor-pointer opacity-100' : 'pressable cursor-pointer opacity-40 hover_opacity-100'"
  )
template(v-else)
  .pressable.transitio.relative.cursor-pointer.select-none.items-center.justify-center.overflow-hidden.transition.hover_opacity-100(
    :class="selected ? 'opacity-100' : 'opacity-40'"
  )
    img.aspect-square.rounded.bg-base-50.object-contain.brightness-50.grayscale(
      :src="character.imagePreviewUrl.toString()"
    )
    LockClosedIcon.absolute-centered.z-10.h-8.w-8.text-white
</template>
