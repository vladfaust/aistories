<script setup lang="ts">
import Jdenticon from "@/components/utility/Jdenticon.vue";
import { userId, web3Token } from "@/store";
import * as api from "@/services/api";
import Accounts from "./Me/Accounts.vue";
import Energy from "./Me/Energy.vue";

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
</script>

<template lang="pug">
.flex.w-full.max-w-3xl.flex-col.gap-4
  .flex.select-none.items-baseline.justify-between
    span.ml-2.text-xl.font-semibold.leading-none Profile
    p.text-sm.text-base-500 Your profile info

  .flex.gap-3
    Jdenticon.h-24.w-24.shrink-0.rounded-full.border.p-2(:input="userId")
    .flex.w-full.flex-col.justify-center
      .flex.items-center.justify-between.gap-3
        span.shrink-0.select-none ID
        .w-full.bg-base-100(class="h-[1px]")
        code.shrink-0.text-sm.text-base-500 {{ userId }}

  .flex.select-none.items-baseline.justify-between
    span.ml-2.text-xl.font-semibold.leading-none Energy
    p.text-sm.text-base-500 Energy is used to generate content

  Energy.rounded.border

  .flex.select-none.items-baseline.justify-between
    span.ml-2.text-xl.font-semibold.leading-none Accounts
    p.text-sm.text-base-500 Your accounts

  Accounts.rounded.border

  button.btn.btn-error(@click="disconnect") Log out
</template>
