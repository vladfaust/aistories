<script setup lang="ts">
import Character from "@/models/Character";
import * as eth from "@/services/eth";
const { char } = defineProps<{ char: Character }>();
</script>

<template lang="pug">
.flex.flex-col.gap-1
  .flex.items-center.justify-between.gap-2
    RouterLink.link-hover.shrink-0.text-lg.font-semibold.leading-none(
      :to="'/chars/' + char.id"
    )
      | {{ char.name }}
    .w-full.bg-base-100(class="h-[1px]")
    span.shrink-0.text-base-400(title="Character id")
      span.select-none #
      span {{ char.id }}
  p.text-sm.leading-tight {{ char.about }}
  .mt-2.flex.items-center.gap-2(v-if="char.erc1155Token")
    template(v-if="eth.account.value")
      a.btn.btn-nft(:href="char.erc1155Token.uri.toString()")
        span(v-if="char.collected.value") See NFT
        span(v-else) Collect NFT to unlock
      span.text-sm.text-gray-400(v-if="char.collected.value") {{ char.balance.value }} collected
    template(v-else)
      button.btn.btn-web3(@click="eth.connect") Connect wallet
      p.text-xs.leading-none.text-base-500
        | This is an NFT character.
        br
        | You need to connect your Web3 wallet to use it.
</template>
