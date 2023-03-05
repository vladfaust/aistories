<script setup lang="ts">
import Jdenticon from "@/components/utility/Jdenticon.vue";
import { userId } from "@/store";
import * as api from "@/services/api";
import { onMounted, ref } from "vue";
import Spinner2 from "@/components/utility/Spinner2.vue";

const openAiApiKey = ref<string | null>(null);
const openAiApiKeySaveInProgress = ref(false);
const openAiApiKeyJustSaved = ref(false);

async function disconnect() {
  const response = await api.rest.auth.clear();

  if (!response.ok) {
    throw response;
  } else {
    userId.value = null;
    window.location.reload();
  }
}

function saveOpenAiApiKey() {
  if (openAiApiKeyJustSaved.value) return;
  openAiApiKeySaveInProgress.value = true;

  try {
    api.trpc.commands.user.settings.set.mutate({
      key: "openAiApiKey",
      value: openAiApiKey.value!,
    });

    openAiApiKeyJustSaved.value = true;
    setTimeout(() => {
      openAiApiKeyJustSaved.value = false;
    }, 2000);
  } catch (e) {
  } finally {
    openAiApiKeySaveInProgress.value = false;
  }
}

onMounted(() => {
  api.trpc.commands.user.settings.get.query("openAiApiKey").then((res) => {
    openAiApiKey.value = res;
  });
});
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-3
  Jdenticon.w-24.place-self-center.rounded.border(:input="userId")
  .flex.flex-col.gap-2.rounded.border.p-3
    .w-max.shrink-0.font-medium OpenAI API Key
    .flex.items-center.gap-2
      input.h-full.w-full.rounded.border.px-2.py-1(
        type="password"
        v-model="openAiApiKey"
        placeholder="OpenAI API Key"
      )
      button.btn.shrink-0(
        @click="saveOpenAiApiKey"
        :disabled="openAiApiKeyJustSaved || openAiApiKeySaveInProgress"
        :class="{ 'btn-success': openAiApiKeyJustSaved, 'btn-primary': !openAiApiKeyJustSaved }"
      )
        Spinner2.h-5.animate-spin(v-if="openAiApiKeySaveInProgress")
        span(v-else-if="openAiApiKeyJustSaved") Saved ✔
        span(v-else) Save 💾
    p.text-sm.leading-snug.text-base-500
      | OpenAI API Key is used to generate text responses.
      | You can get one from
      |
      a.link(href="https://platform.openai.com/account/api-keys") openai.com
      |
      | ($18 in free credit for new users, would be enough for many stories).
  button.btn.btn-error(@click="disconnect") Log out
</template>
