<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import Story from "@/models/Story";
import { trpc } from "@/services/api";
import * as web3Auth from "@/services/web3Auth";
import Currency from "@/components/utility/Currency.vue";
import { addRemoveClassAfterTimeout } from "@/utils";
import { type Unsubscribable } from "@trpc/server/observable";

const ENERGY_COST = 1;

const { story } = defineProps<{
  story: Story;
}>();

const nextActorId = ref(0);

const energy = useLocalStorage("energy", 0);
const energyRef = ref<any | null>(null);

const inputText = ref("");
const textarea = ref<HTMLTextAreaElement | null>(null);
const textareaFocused = ref(false);
const inputLocked = ref(false);

const inputDisabled = computed(() => {
  return (
    inputLocked.value ||
    userCharacter.value.ref.value?.id !== nextActorId.value ||
    energy.value < ENERGY_COST
  );
});

const userCharacter = computed(() => {
  return story.users[0].char;
});

const maySend = computed(() => {
  return (
    userCharacter.value.ref.value?.id === nextActorId.value &&
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

  console.log("maySend", maySend.value);
  if (!maySend.value) return;

  inputLocked.value = true;

  const text = inputText.value.trim();

  try {
    await trpc.story.addContent.mutate({
      authToken: await web3Auth.ensure(),
      storyId: story.id,
      content: text,
    });

    inputText.value = "";
  } finally {
    inputLocked.value = false;
  }
}

let unsub: Unsubscribable;

onMounted(async () => {
  textarea.value!.focus();

  unsub = trpc.story.onTurn.subscribe(
    {
      authToken: await web3Auth.ensure(),
      storyId: story.id,
    },
    {
      onData: (data) => {
        nextActorId.value = data.nextCharId;
      },
    }
  );
});

onUnmounted(() => {
  unsub.unsubscribe();
});
</script>

<template lang="pug">
.relative.flex.h-14.w-full
  .absolute.top-2.left-2(v-if="userCharacter?.ref.value")
    img.h-10.w-10.rounded-full.border.object-cover(
      :src="userCharacter.ref.value.imagePreviewUrl.toString()"
    )
  textarea.h-full.w-full.resize-none.py-4.pl-14.pr-12.leading-tight(
    ref="textarea"
    placeholder="Write a message..."
    @keypress.enter.prevent.exact="sendMessage"
    v-model="inputText"
    :disabled="inputDisabled"
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
