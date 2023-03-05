<script setup lang="ts">
import { computed, onMounted, type Ref, ref } from "vue";
import Story from "@/models/Story";
import * as api from "@/services/api";

const { story, busy } = defineProps<{
  story: Story;
  busy: boolean;
}>();

const textarea = ref<HTMLTextAreaElement | null>(null);
const textareaFocused = ref(false);
const inputLocked = ref(false);
const inputText: Ref<string | undefined> = ref();

const inputDisabled = computed(() => {
  return busy || inputLocked.value;
});

const maySend = computed(() => {
  return !busy;
});

async function sendMessage() {
  if (!maySend.value) return;

  inputLocked.value = true;

  const text = inputText.value?.trim();

  try {
    await api.trpc.commands.story.advance.mutate({
      storyId: story.id,
      userMessage: text,
    });

    inputText.value = undefined;
  } finally {
    inputLocked.value = false;
  }
}

function addNewline() {
  if (!textareaFocused.value) return;

  const text = inputText.value ?? "";
  inputText.value = text + "\n";
}

onMounted(async () => {
  textarea.value!.focus();
});
</script>

<template lang="pug">
.box-border.flex.w-full.items-center.gap-2.p-3(
  :class="{ 'bg-base-100': inputDisabled }"
)
  img.box-border.aspect-square.h-9.rounded.border.object-cover(
    v-if="story.user.char?.ref.value"
    :src="story.user.char.ref.value.imagePreviewUrl.toString()"
  )
  textarea.w-full.bg-base-50.px-3.py-2.text-sm.leading-tight(
    ref="textarea"
    placeholder="Write a message..."
    @keypress.enter.prevent.exact="sendMessage"
    @keypress.shift.enter.prevent.exact="addNewline"
    v-model="inputText"
    :disabled="inputDisabled"
    :class="{ 'cursor-not-allowed': inputDisabled }"
    rows="1"
    @focus="textareaFocused = true"
    @blur="textareaFocused = false"
  )
</template>
