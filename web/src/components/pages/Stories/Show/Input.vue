<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import { useLocalStorage, useNow } from "@vueuse/core";
import Story from "@/models/Story";
import { trpc } from "@/services/api";
import * as web3Auth from "@/services/web3Auth";
import Currency from "@/components/utility/Currency.vue";
import { addRemoveClassAfterTimeout } from "@/utils";

const ENERGY_COST = 1;

const { story } = defineProps<{
  story: Story;
}>();

const now = useNow();
const energy = useLocalStorage("energy", 0);
const energyRef = ref<any | null>(null);

const inputText = ref("");
const textarea = ref<HTMLTextAreaElement | null>(null);
const textareaFocused = ref(false);
const inputLocked = ref(false);

const maySend = computed(() => {
  return (
    inputText.value &&
    inputText.value.trim().length > 0 &&
    energy.value >= ENERGY_COST
  );
});

async function sendMessage() {
  if (energy.value < ENERGY_COST) {
    // Add a little animation to the energy button
    addRemoveClassAfterTimeout(
      energyRef.value!.$el,
      ["animate__animated", "animate__headShake"],
      1000
    );
  }

  if (!maySend.value) return;

  inputLocked.value = true;

  const text = inputText.value.trim();

  try {
    await trpc.story.sendMessage.mutate({
      authToken: await web3Auth.ensure(),
      storyId: story.id,
      message: { text },
    });

    inputText.value = "";
  } finally {
    inputLocked.value = false;
  }
}

async function addNewline() {
  inputText.value += "\n";
}
</script>

<template lang="pug">
.relative.h-14.w-full
  textarea.h-full.w-full.resize-none.p-4.pr-12.leading-tight(
    ref="textarea"
    placeholder="Write a message..."
    @keypress.enter.prevent.exact="sendMessage"
    @keypress.shift.enter.exact="addNewline"
    v-model="inputText"
    :disabled="inputLocked"
    rows="1"
    @focus="textareaFocused = true"
    @blur="textareaFocused = false"
  )
  .absolute.right-0.top-0.flex.h-full.items-center.justify-center.p-2
    .flex.cursor-help.items-center.rounded-lg.bg-base-50.py-2.pl-4.pr-3.transition-colors(
      ref="energyRef"
      :title="`A message costs ${ENERGY_COST} energy`"
    )
      span.font-medium(
        :class="energy >= ENERGY_COST ? 'text-base-500' : textareaFocused ? 'text-red-500' : 'text-base-500'"
      ) {{ ENERGY_COST }}
      Currency.h-5.w-5
</template>
