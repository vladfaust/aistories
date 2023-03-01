<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import Story from "@/models/Story";
import * as api from "@/services/api";
import { type Unsubscribable } from "@trpc/server/observable";

const { story } = defineProps<{
  story: Story;
}>();

const nextActorId = ref(0);

const inputText = ref("");
const textarea = ref<HTMLTextAreaElement | null>(null);
const textareaFocused = ref(false);
const inputLocked = ref(false);

const inputDisabled = computed(() => {
  return (
    inputLocked.value || userCharacter.value.ref.value?.id !== nextActorId.value
  );
});

const userCharacter = computed(() => {
  return story.users[0].char;
});

const maySend = computed(() => {
  return (
    userCharacter.value.ref.value?.id === nextActorId.value &&
    inputText.value &&
    inputText.value.trim().length > 0
  );
});

async function sendMessage() {
  if (!maySend.value) return;

  inputLocked.value = true;

  const text = inputText.value.trim();

  try {
    await api.commands.story.addContent.mutate({
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

  unsub = api.subscriptions.story.onTurn.subscribe(
    { storyId: story.id },
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
.box-border.flex.w-full.items-center.gap-2.p-3(
  :class="{ 'bg-base-100': inputDisabled }"
)
  img.box-border.aspect-square.h-9.rounded.border.object-cover(
    v-if="userCharacter?.ref.value"
    :src="userCharacter.ref.value.imagePreviewUrl.toString()"
  )
  textarea.w-full.resize-none.bg-base-50.px-3.py-2.text-sm.leading-tight(
    ref="textarea"
    placeholder="Write a message..."
    @keypress.enter.prevent.exact="sendMessage"
    v-model="inputText"
    :disabled="inputDisabled"
    :class="{ 'cursor-not-allowed': inputDisabled }"
    rows="1"
    @focus="textareaFocused = true"
    @blur="textareaFocused = false"
  )
</template>
