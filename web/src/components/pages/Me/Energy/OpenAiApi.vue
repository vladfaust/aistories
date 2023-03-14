<script setup lang="ts">
import { onMounted, ref, watchEffect } from "vue";
import * as api from "@/services/api";
import Spinner2 from "@/components/utility/Spinner2.vue";
import nProgress from "nprogress";

const [enabledVal, keyVal] = await Promise.all([
  api.trpc.commands.me.settings.get.query("openAiApiKey"),
  api.trpc.commands.me.settings.get.query("useOpenAiApiKey"),
]);

const enabled = ref(enabledVal === "true");
const key = ref(keyVal);

const enabledSaveInProgress = ref(false);
watchEffect(() =>
  enabledSaveInProgress.value ? nProgress.start() : nProgress.done()
);

const keySaveInProgress = ref(false);
watchEffect(() =>
  keySaveInProgress.value ? nProgress.start() : nProgress.done()
);

const justSavedKey = ref(false);

async function saveEnabled() {
  enabledSaveInProgress.value = true;

  try {
    api.trpc.commands.me.settings.set.mutate({
      key: "useOpenAiApiKey",
      value: enabled.value ? "true" : "false",
    });
  } catch (e) {
  } finally {
    enabledSaveInProgress.value = false;
  }
}

function saveKey() {
  if (justSavedKey.value) return;
  keySaveInProgress.value = true;

  try {
    api.trpc.commands.me.settings.set.mutate({
      key: "openAiApiKey",
      value: key.value!,
    });

    justSavedKey.value = true;
    setTimeout(() => {
      justSavedKey.value = false;
    }, 2000);
  } catch (e) {
  } finally {
    keySaveInProgress.value = false;
  }
}

onMounted(() => {
  api.trpc.commands.me.settings.get.query("openAiApiKey").then((res) => {
    key.value = res;
  });

  api.trpc.commands.me.settings.get.query("useOpenAiApiKey").then((res) => {
    enabled.value = res === "true";
  });
});
</script>

<template lang="pug">
.flex.flex-col
  .flex.items-center.justify-between.gap-3
    span.shrink-0 OpenAI API key
    .w-full.bg-base-100(class="h-[1px]")
    .flex.shrink-0.items-center
      label.cursor-pointer.select-none.text-sm.text-base-500(
        for="enable-openai-key"
      ) Enable
      input#enable-openai-key.toggle.m-0.ml-2.cursor-pointer(
        type="checkbox"
        v-model="enabled"
        @change="saveEnabled"
        :disabled="enabledSaveInProgress"
      )

  .my-1.flex.items-center.gap-2(v-if="enabled && !enabledSaveInProgress")
    input.h-full.w-full.rounded.border.px-2.py-1.text-sm(
      type="password"
      v-model="key"
      placeholder="Enter your OpenAI API key here"
    )
    button.btn.btn-sm.shrink-0(
      @click="saveKey"
      :disabled="justSavedKey || keySaveInProgress"
      :class="{ 'btn-success': justSavedKey, 'btn-primary': !justSavedKey }"
    )
      Spinner2.h-5.animate-spin(v-if="keySaveInProgress")
      span(v-else-if="justSavedKey") Saved
      span(v-else) Save

  p.text-sm.leading-tight.text-base-500
    | You may opt-in using your own OpenAI API key is to generate text, instead of energy.
    | You can get free API key from
    |
    a.link(href="https://platform.openai.com/account/api-keys") openai.com
    |
    | ($18 in free credit for new users, would be enough for many stories).
</template>
