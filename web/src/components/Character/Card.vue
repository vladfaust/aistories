<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import Character from "@/models/Character";
import {
  LockClosedIcon,
  EyeSlashIcon,
  CubeIcon,
} from "@heroicons/vue/24/outline";

const { char, click } = defineProps<{ char: Character; click?: () => void }>();
</script>

<template lang="pug">
RouterLink.contents(
  :to="'/chars/' + char.id"
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
      LockClosedIcon.absolute-centered.z-10.h-8.w-8.text-white.transition-opacity.group-hover_opacity-0(
        v-if="!char.collected.value"
      )
      img.aspect-square.object-cover.transition(
        :src="char.imageUrl.toString()"
        :class="{ 'group-hover_scale-105': char.collected.value, 'scale-110 blur-sm brightness-50 group-hover_scale-100 group-hover_blur-none group-hover_brightness-100': !char.collected.value }"
      )
      .absolute.bottom-1.right-1.rounded.bg-white.p-1.leading-none.shadow(
        v-if="!char.public_.value || char.erc1155Token"
      )
        EyeSlashIcon.h-4.text-base-500(
          v-if="!char.public_.value"
          title="Private"
        )
        CubeIcon.h-4.text-base-500(
          v-if="char.erc1155Token"
          title="NFT Collectible"
        )
    .relative.flex.w-full.flex-col(class="gap-0.5")
      span.text-center.text-sm.font-medium.leading-none {{ char.name.value }}
      span.text-center.text-xs.italic.leading-none.text-base-500 {{ char.lore.ref.value?.name.value }}
</template>
