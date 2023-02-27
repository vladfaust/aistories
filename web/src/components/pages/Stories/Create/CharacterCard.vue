<script setup lang="ts">
import Character from "@/models/Character";
const { character } = defineProps<{ character: Character }>();
</script>

<template lang="pug">
.flex.flex-col.gap-3.rounded.border.p-4.sm_flex-row
  img.aspect-square.rounded.bg-base-50.object-contain.sm_w-32(
    :src="character.imagePreviewUrl.toString()"
    :class="{ grayscale: !character.collected.value }"
  )
  .flex.flex-col.gap-1
    span.text-lg.font-bold.leading-tight {{ character.name }}
    span.text-sm.leading-tight.text-base-500 {{ character.title }}
    p.leading-tight {{ character.about }}
    .mt-1.flex.items-center.gap-2(v-if="character.erc1155Token")
      a.btn.btn-nft(:href="character.erc1155Token.uri.toString()")
        span(v-if="character.collected.value") See NFT
        span(v-else) Collect NFT to unlock
      span.text-sm.text-gray-400(v-if="character.collected.value") {{ character.balance.value }} collected
</template>
