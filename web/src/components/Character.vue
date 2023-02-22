<script setup lang="ts">
import { type Character } from "@/models/Character";
import { trpc } from "@/services/api";
import { account, getErc1155Balance } from "@/services/eth";
import * as web3Auth from "@/services/web3Auth";
import { useNow } from "@vueuse/core";
import { ref, type Ref, watch, computed } from "vue";
import { formatDistance } from "date-fns";
import { BigNumber, ethers } from "ethers";

const now = useNow();

const { char } = defineProps<{
  char: Character;
}>();

const session: Ref<
  | {
      id: number;
      endedAt: Date;
    }
  | null
  | undefined
> = ref();

const sessionActive = computed(() => {
  if (!session.value) return false;
  return session.value.endedAt > now.value;
});

const tokenBalance: Ref<BigNumber | undefined | null> = ref();

watch(
  account,
  async (account) => {
    if (account) {
      const authToken = await web3Auth.ensure();

      trpc.chat.session.findActive
        .query({
          authToken,
          chat: {
            characterId: char.id,
          },
        })
        .then((found) => {
          if (found) {
            session.value = {
              id: found.id,
              endedAt: new Date(found.endedAt),
            };
          } else {
            session.value = null;
          }
        });

      if (char.erc1155Address) {
        tokenBalance.value = await getErc1155Balance(
          ethers.utils.hexlify(char.erc1155Address.data),
          char.erc1155Id!.data
        );
      }
    } else {
      session.value = undefined;
      tokenBalance.value = undefined;
    }
  },
  {
    immediate: true,
  }
);
</script>

<template lang="pug">
.flex.items-center.gap-3.rounded-lg.border.p-4
  RouterLink.contents(:to="'/chat/' + char.id")
    img.pressable.relative.aspect-square.w-40.rounded.bg-base-50.object-contain.transition.hover_opacity-80(
      :src="char.imagePreviewUrl"
    )
  .flex.flex-col.gap-1
    RouterLink.pressable.max-w-max.text-xl.font-bold.leading-tight.transition(
      :to="'/chat/' + char.id"
    ) {{ char.name }}
    p.leading-tight {{ char.about }}
    .mt-1.flex.items-center.gap-2
      router-link.btn.btn-base.text-white(
        v-if="tokenBalance?.gt(0)"
        :to="'/chat/' + char.id"
        :class="{ 'btn-success': sessionActive }"
      )
        span(v-if="session && sessionActive") Simulation ({{ formatDistance(session.endedAt.valueOf(), now.valueOf()) }} left)
        span(v-else) Chat
      a.btn-nft.btn(v-if="!tokenBalance?.gt(0)" href="https://example.com") Collect NFT to chat
      a.btn-nft.btn(v-else href="https://example.com") See NFT
</template>
