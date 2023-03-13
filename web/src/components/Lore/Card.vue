<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import Lore from "@/models/Lore";
import { EyeSlashIcon } from "@heroicons/vue/24/outline";

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
    .relative.overflow-hidden.rounded.border
      img.aspect-square.object-cover.transition.group-hover_scale-105(
        v-if="lore"
        :src="lore.imageUrl.toString()"
      )
      .absolute.bottom-1.right-1.rounded.bg-white.p-1.leading-none.shadow(
        v-if="!lore.public_.value"
      )
        EyeSlashIcon.h-4.text-base-500(v-if="!lore.public_.value")
    span.text-center.text-sm.font-medium.leading-none {{ lore.name.value }}
</template>
