<script setup lang="ts">
import { type Character } from "@/models/Character";
import { trpc } from "@/services/api";
import { account, provider } from "@/services/eth";
import * as web3Auth from "@/services/web3Auth";
import { useNow } from "@vueuse/core";
import { ref, type Ref, watch, computed } from "vue";
import { format } from "date-fns";
import { BigNumber, ethers } from "ethers";
import erc1155Abi from "@/assets/abi/erc1155.json";

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
        const contract = new ethers.Contract(
          ethers.utils.hexlify(char.erc1155Address.data),
          erc1155Abi,
          provider.value!
        );

        contract
          .balanceOf(account, char.erc1155Id!.data)
          .then((balance: BigNumber) => {
            tokenBalance.value = balance;
          });
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
.flex
  img.aspect-square.w-32.rounded.object-contain(
    :src="char.imagePreviewUrl"
    :class="{ 'opacity-50': !tokenBalance || tokenBalance.isZero() }"
  )
  .flex.flex-col.gap-2
    span.text-xl.font-semibold.leading-none {{ char.name }}
    p.leading-tight {{ char.about }}
    .flex.items-center.gap-2
      router-link.btn.leading-none(
        :to="'/chat/' + char.id"
        :class="{ 'btn-primary': !sessionActive, 'btn-success': sessionActive }"
      )
        span(v-if="session && sessionActive") Continue simulation ({{ format(new Date(session.endedAt.valueOf() - now.valueOf()), "mm:ss") }})
        span(v-else) Open interface
      span Token balance: {{ tokenBalance || 0 }}
</template>
