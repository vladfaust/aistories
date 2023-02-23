<script setup lang="ts">
import { Character } from "@/models/Character";

const { character } = defineProps<{
  character: Character;
}>();
</script>

<template lang="pug">
.flex.flex-col.items-center.gap-4.p-8
  img.aspect-square.rounded-full.bg-base-50(
    :src="character.imagePreviewUrl.toString()"
  )

  .mt-1.flex.flex-col.items-center(class="gap-1.5")
    span.text-lg.font-bold.leading-none {{ character.name }}
    span.leading-none.text-base-500 {{ character.title }}
    p.text-center.text-sm.leading-tight {{ character.about }}

  .flex.flex-col.items-center.gap-1(v-if="character.erc1155Token")
    a.btn.btn-nft(:href="character.erc1155Token.uri.toString()")
      span(v-if="character.collected.value") See NFT
      span(v-else) Collect NFT to unlock
    span.text-sm.text-gray-400 {{ character.balance.value || 0 }} collected
</template>
