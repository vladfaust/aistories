<script setup lang="ts">
import Character from "@/models/Character";
import * as eth from "@/services/eth";
const { character } = defineProps<{ character: Character }>();
</script>

<template lang="pug">
.flex.flex-col.gap-3.rounded.border.p-3.sm_flex-row
  img.aspect-square.w-48.rounded.border.bg-base-50.object-contain.sm_w-32(
    :src="character.imagePreviewUrl.toString()"
  )
  .flex.flex-col.gap-1
    span.text-lg.font-bold.leading-none {{ character.name }}
    p.leading-tight {{ character.about }}
    .mt-1.flex.items-center.gap-2(v-if="character.erc1155Token")
      template(v-if="eth.account.value")
        a.btn.btn-nft(:href="character.erc1155Token.uri.toString()")
          span(v-if="character.collected.value") See NFT
          span(v-else) Collect NFT to unlock
        span.text-sm.text-gray-400(v-if="character.collected.value") {{ character.balance.value }} collected
      template(v-else)
        button.btn.btn-web3(@click="eth.connect") Connect wallet
        p.text-xs.leading-none.text-base-500
          | This is an NFT character.
          br
          | You need to connect your Web3 wallet to use it.
</template>
