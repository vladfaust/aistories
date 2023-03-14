<script setup lang="ts">
import { computed, onMounted, type Ref, ref, watchEffect } from "vue";
import Story from "@/models/Story";
import * as api from "@/services/api";
import { userId } from "@/store";
import { PaperAirplaneIcon, ForwardIcon } from "@heroicons/vue/24/outline";
import Spinner2 from "@/components/utility/Spinner2.vue";
import nProgress from "nprogress";

const { story, busy } = defineProps<{
  story: Story;
  busy: boolean;
}>();

const textareaEl = ref<HTMLTextAreaElement | null>(null);
const textareaFocused = ref(false);
const inputText: Ref<string | undefined> = ref();

const advanceInProgress = ref(false);
watchEffect(() =>
  advanceInProgress.value ? nProgress.start() : nProgress.done()
);

const mayAdvance = computed(() => {
  return (
    userId.value &&
    userId.value == story.user.id &&
    !busy &&
    !advanceInProgress.value
  );
});

async function advance() {
  if (!mayAdvance.value) return;

  advanceInProgress.value = true;

  const text = inputText.value?.trim();
  inputText.value = undefined;

  try {
    await api.trpc.commands.story.advance.mutate({
      storyId: story.id,
      userMessage: text,
    });
  } catch (e) {
    inputText.value = text; // Restore unsent text
    throw e;
  } finally {
    advanceInProgress.value = false;
  }
}

function addNewline() {
  if (!textareaFocused.value) return;

  const text = inputText.value ?? "";
  inputText.value = text + "\n";
}

onMounted(async () => {
  textareaEl.value!.focus();
});
</script>

<template lang="pug">
.box-border.flex.w-full.items-center.gap-2.p-3(
  :class="{ 'bg-base-100': !mayAdvance }"
)
  img.box-border.aspect-square.h-9.rounded.border.object-cover(
    v-if="story.user.char?.ref.value"
    :src="story.user.char.ref.value.imageUrl.toString()"
  )
  textarea.w-full.bg-base-50.px-3.py-2.text-sm.leading-tight(
    ref="textareaEl"
    placeholder="Write text..."
    @keypress.enter.prevent.exact="advance"
    @keypress.shift.enter.prevent.exact="addNewline"
    v-model="inputText"
    :disabled="!mayAdvance"
    :class="{ 'cursor-not-allowed': !mayAdvance }"
    rows="1"
    @focus="textareaFocused = true"
    @blur="textareaFocused = false"
  )
  button.pressable.btn.btn-square.btn-sm.btn-primary.aspect-square.h-full(
    @click="advance"
    :disabled="!mayAdvance"
    :class="{ 'cursor-not-allowed': !mayAdvance }"
    :title="inputText ? 'Send' : 'Skip turn'"
  )
    Spinner2.h-5.animate-spin(v-if="busy || advanceInProgress")
    PaperAirplaneIcon.h-5(v-else-if="inputText")
    ForwardIcon.h-5(v-else)
</template>
