<script setup lang="ts">
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
  const response = await trpc.chat.session.initialize.mutate({
    authToken: await web3Auth.ensure(),
    characterId: character.id,
  });

  session.value = {
    id: response.id,
    endedAt: new Date(response.endedAt),
  };
}

async function ensureSession() {
  if (sessionActive.value) return;
  await initializeSession();
}

const inputText = ref("");
const textarea = ref<HTMLTextAreaElement | null>(null);
const inputLocked = ref(false);

const maySend = computed(() => {
  return inputText.value && inputText.value.trim().length > 0;
});

async function sendMessage() {
  if (!maySend.value) return;

  inputLocked.value = true;

  await ensureSession();

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
textarea.h-14.w-full.resize-none.p-4.leading-tight(
  ref="textarea"
  placeholder="Write a message..."
  @keypress.enter.prevent.exact="sendMessage"
  @keypress.shift.enter.exact="addNewline"
  v-model="inputText"
  :disabled="inputLocked"
  rows="1"
)
</template>
