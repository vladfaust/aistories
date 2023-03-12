<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import Lore from "@/models/Lore";
const { lore, click } = defineProps<{ lore: Lore; click?: () => void }>();
</script>

<template lang="pug">
RouterLink.contents(
  :to="'/lores/' + lore.id"
  custom
  v-slot="{ href, navigate }"
)
  a.pressable.group.flex.flex-col.items-center.justify-start.transition-transform(
    :href="href"
    @click.exact.prevent="click ? click() : navigate()"
    @click="navigate"
    v-bind="$attrs"
  )
    .overflow-hidden.rounded.border
      img.transition.group-hover_scale-105(
        v-if="lore"
        :src="lore.imageUrl.toString()"
      )
    span.text-center.text-sm.font-medium.leading-none {{ lore.name }}
</template>
