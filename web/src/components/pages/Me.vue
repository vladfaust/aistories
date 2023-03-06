<script setup lang="ts">
import Jdenticon from "@/components/utility/Jdenticon.vue";
import { userId, web3Token } from "@/store";
import * as api from "@/services/api";
import { onMounted, ref } from "vue";
import Spinner2 from "@/components/utility/Spinner2.vue";
import * as eth from "@/services/eth";

const openAiApiKey = ref<string | null>(null);
const openAiApiKeySaveInProgress = ref(false);
const openAiApiKeyJustSaved = ref(false);

async function disconnect() {
  const response = await api.rest.auth.clear();

  if (!response.ok) {
    throw response;
  } else {
    userId.value = null;
    web3Token.value = null;
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
.flex.w-full.max-w-3xl.flex-col.gap-5
  Jdenticon.w-24.place-self-center.rounded.border(:input="userId")

  //- OpenAI API Key
  .flex.flex-col.gap-2
    .flex.flex-col.gap-2.rounded.border.p-3
      .text-center.font-medium OpenAI API Key
      .flex.items-center.gap-2
        input.h-full.w-full.rounded.border.px-2.py-1.text-center(
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
    p.text-center.text-sm.leading-snug.text-base-500
      | OpenAI API Key is used to generate text responses.
      | You can get one from
      |
      a.link(href="https://platform.openai.com/account/api-keys") openai.com
      |
      | ($18 in free credit for new users, would be enough for many stories).

  //- Ethereum wallet
  .flex.flex-col.gap-2
    .flex.items-center.justify-between.rounded.border.p-3
      span.font-medium Ethereum wallet

      .flex.items-center.gap-2(v-if="eth.account.value")
        span.text-sm {{ eth.account.value.slice(0, 9) }}
        Jdenticon.w-8.rounded.border(:input="eth.account.value")
        button.btn.btn-error.btn-sm(@click="eth.disconnect") Disconnect
      .flex.items-center.gap-2(v-else)
        span.text-sm.text-base-400 Not connected
        button.btn.btn-web3.btn-sm(@click="eth.connect") Connect wallet
    p.text-center.text-sm.leading-snug.text-base-500
      | Ethereum wallet is used to collect characters.
  button.btn.btn-error(@click="disconnect") Log out
</template>
