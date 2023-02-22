<script setup lang="ts">
import { format } from "date-fns";
import { computed, ref, type Ref } from "vue";
import { useNow } from "@vueuse/core";
import { type Character } from "@/models/Character";
import { trpc } from "@/services/api";
import * as web3Auth from "@/services/web3Auth";
import { BigNumber, ethers } from "ethers";
import erc1155Abi from "@/assets/abi/erc1155.json";
import { account, provider } from "@/services/eth";

type Session = {
  id: number;
  endedAt: Date;
};

const { character } = defineProps<{
  character: Character;
}>();

const now = useNow();

const session: Ref<Session | null | undefined> = ref();

const sessionActive = computed(() => {
  if (!session.value) return false;
  return session.value.endedAt > now.value;
});

async function initializeSession() {
  if (!character) throw new Error("No character");

  const response = await trpc.chat.session.initialize.mutate({
    authToken: await web3Auth.ensure(),
    characterId: character.id,
  });

  session.value = {
    id: response.id,
    endedAt: new Date(response.endedAt),
  };
}

const tokenBalance: Ref<BigNumber | undefined | null> = ref();

web3Auth.ensure().then((authToken) => {
  if (!authToken) return;

  trpc.chat.session.findActive
    .query({
      authToken,
      chat: { characterId: character.id },
    })
    .then((data) => {
      if (data) {
        session.value = {
          id: data.id,
          endedAt: new Date(data.endedAt),
        };
      } else {
        session.value = null;
      }
    });

  if (character.erc1155Address) {
    const contract = new ethers.Contract(
      ethers.utils.hexlify(character.erc1155Address.data),
      erc1155Abi,
      provider.value!
    );

    contract
      .balanceOf(account.value!, character.erc1155Id!.data)
      .then((balance: BigNumber) => {
        tokenBalance.value = balance;
      });
  }
});

const inputText = ref("");
const textarea = ref<HTMLTextAreaElement | null>(null);
const inputLocked = ref(false);

const maySend = computed(() => {
  return (
    session.value &&
    sessionActive.value &&
    inputText.value &&
    inputText.value.trim().length > 0
  );
});

async function sendMessage() {
  if (!maySend.value) return;

  inputLocked.value = true;

  const text = inputText.value.trim();
  inputText.value = "";

  try {
    await trpc.chat.session.sendMessage.mutate({
      authToken: await web3Auth.ensure(),
      sessionId: session.value!.id,
      text,
    });
  } finally {
    inputLocked.value = false;
  }
}

async function addNewline() {
  inputText.value += "\n";
}
</script>

<template lang="pug">
.flex.flex-col.gap-3.p-4
  template(v-if="session && sessionActive")
    textarea.h-full.w-full.resize-none.rounded-lg.border.px-4.py-3.leading-tight(
      ref="textarea"
      placeholder="Simulation terminal"
      @keypress.enter.prevent.exact="sendMessage"
      @keypress.shift.enter.exact="addNewline"
      v-model="inputText"
      :disabled="inputLocked"
      rows="2"
    )
    .flex.items-center.justify-between
      .rounded.bg-base-100.px-2.text-sm.text-gray-500(class="py-1.5")
        | {{ format(new Date(session.endedAt.valueOf() - now.valueOf()), "mm:ss") }}
      button.btn-primary.btn-sm.btn(@click="sendMessage" :disabled="!maySend") Send

  .flex.flex-col.items-center.gap-1(v-else-if="tokenBalance?.gt(0)")
    button.btn-primary.btn(
      @click="initializeSession"
      :disabled="!tokenBalance || tokenBalance.isZero()"
    ) Begin simulation
</template>
