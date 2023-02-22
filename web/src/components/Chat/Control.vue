<script setup lang="ts">
import { format } from "date-fns";
import { computed, ref, type Ref } from "vue";
import { useNow } from "@vueuse/core";
import { type Character } from "@/models/Character";
import { trpc } from "@/services/api";
import * as web3Auth from "@/services/web3Auth";

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
});

const inputText = ref("");
const textarea = ref<HTMLTextAreaElement | null>(null);
const inputLocked = ref(false);

async function sendMessage() {
  if (
    !session.value ||
    inputLocked.value ||
    !inputText.value ||
    inputText.value.trim().length === 0
  ) {
    return;
  }

  inputLocked.value = true;

  const text = inputText.value.trim();
  inputText.value = "";

  try {
    await trpc.chat.session.sendMessage.mutate({
      authToken: await web3Auth.ensure(),
      sessionId: session.value.id,
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
.flex.flex-col.gap-2.rounded-lg.bg-gray-50.p-4
  template(v-if="session && sessionActive")
    textarea.h-full.w-full.resize-none.rounded.border.px-4.py-2.leading-tight(
      ref="textarea"
      placeholder="Simulation terminal"
      @keypress.enter.prevent.exact="sendMessage"
      @keypress.shift.enter.exact="addNewline"
      v-model="inputText"
      :disabled="inputLocked"
      rows="3"
    )
    .flex.items-center.justify-between
      .rounded.bg-gray-100.px-2.text-sm.text-gray-500(class="py-1.5")
        | {{ format(new Date(session.endedAt.valueOf() - now.valueOf()), "mm:ss") }}
      button.btn.btn-primary.btn-sm(
        @click="sendMessage"
        :disabled="inputLocked"
      ) Send message
  template(v-else)
    button.btn.btn-primary(@click="initializeSession") Begin simulation
</template>
