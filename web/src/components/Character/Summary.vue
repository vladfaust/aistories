<script setup lang="ts">
import Character from "@/models/Character";
import * as eth from "@/services/eth";
import { userId } from "@/store";
import { formatDistanceToNow } from "date-fns";
import Jdenticon from "@/components/utility/Jdenticon.vue";

const { char } = defineProps<{ char: Character }>();
</script>

<template lang="pug">
.flex.flex-col(class="gap-0.5")
  .flex.items-center.justify-between.gap-2
    span.shrink-0
      RouterLink.link-hover.text-lg.font-semibold.leading-tight(
        :to="'/chars/' + char.id"
      ) {{ char.name.value }}
      span.ml-1.font-light.italic.leading-tight.text-accent-500(
        v-if="char.creatorId == userId && !char.public_.value"
      ) (private)
    .w-full.bg-base-100(class="h-[1px]")
    span.shrink-0.leading-tight.text-base-400(title="Character id")
      span.select-none #
      span {{ char.id }}

  p.text-sm.leading-tight {{ char.about.value }}

  .mt-1.flex.flex-col
    span.text-xs.leading-none.text-base-500
      | Created by
      Jdenticon.mx-1.inline-block.h-4.rounded-full.border(
        :input="char.creatorId"
      )
      span.font-medium {{ char.creatorId }}
      span.italic.text-accent-500(v-if="char.creatorId == userId") &nbsp;(you)&nbsp;
      | {{ formatDistanceToNow(char.createdAt) }} ago

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
