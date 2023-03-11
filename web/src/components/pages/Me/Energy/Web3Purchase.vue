<script setup lang="ts">
import config from "@/config";
import { computed, type Ref, ref } from "vue";
import * as eth from "@/services/eth";
import EnergyIcon from "@/components/utility/EnergyIcon.vue";
import * as api from "@/services/api";
import { BigNumber } from "ethers";
import Spinner2 from "@/components/utility/Spinner2.vue";
import Web3Token from "web3-token";
import { web3Token } from "@/store";
import pRetry from "p-retry";

enum TransferStage {
  None,
  WaitingForSignature,
  WaitingForConfirmation,
}

const [exchangeRate, exchangeMin] = await Promise.all([
  parseFloat(
    (await api.trpc.commands.settings.get.query("energyWeb3ExchangeRate")) ||
      "0"
  ),
  parseFloat(
    (await api.trpc.commands.settings.get.query(
      "energyWeb3ExchangeMinValue"
    )) || "0"
  ),
]);

const inputToken = ref(1);
const inputEnergy = computed(() => inputToken.value * exchangeRate);

const finalCost = computed(() => {
  return BigNumber.from(inputToken.value).mul(
    BigNumber.from(10).pow(config.eth.chain.nativeCurrency.decimals)
  );
});

const transferStage: Ref<TransferStage> = ref(TransferStage.None);
const transferInProgress = computed(() => {
  return transferStage.value !== TransferStage.None;
});
const transferButtonRef = ref<HTMLButtonElement | null>(null);
const treatSourceRef = ref<HTMLElement | null>(null);

async function purchase() {
  if (!eth.provider.value) throw new Error("No provider");

  if (finalCost.value.lt(exchangeMin)) {
    alert("Minimum purchase amount is " + exchangeMin);
    return;
  }

  transferStage.value = TransferStage.WaitingForSignature;

  try {
    web3Token.value ||= await Web3Token.sign(
      async (msg: string) => eth.provider.value!.getSigner().signMessage(msg),
      {
        domain: import.meta.env.PROD ? config.trpcHttpUrl.hostname : undefined,
        expires_in: 60 * 60 * 24 * 1000, // 1 day
      }
    );

    const tx = await eth.provider.value.getSigner().sendTransaction({
      to: config.eth.receiverAddress,
      value: finalCost.value,
    });

    transferStage.value = TransferStage.WaitingForConfirmation;
    await tx.wait();

    await pRetry(
      async () => {
        await api.trpc.commands.me.energy.claim.query({
          web3Token: web3Token.value!,
        });
      },
      {
        retries: 3,
        onFailedAttempt: async (error) => {
          console.error(error);
        },
      }
    );
  } catch (error: any) {
    alert(error.message);
    throw error;
  } finally {
    transferStage.value = TransferStage.None;
  }
}

async function restore() {
  web3Token.value ||= await Web3Token.sign(
    async (msg: string) => eth.provider.value!.getSigner().signMessage(msg),
    {
      domain: import.meta.env.PROD ? config.trpcHttpUrl.hostname : undefined,
      expires_in: 60 * 60 * 24 * 1000, // 1 day
    }
  );

  const result = await api.trpc.commands.me.energy.claim.query({
    web3Token: web3Token.value,
  });

  alert("Restored " + result.claimedEventsCount + " purchases");
}
</script>

<template lang="pug">
.flex.flex-col.gap-3
  p.rounded.bg-base-50.p-3.text-center.leading-tight.text-base-600
    | Purchase energy credits with cryptocurrency

  .flex.w-full.items-center.gap-2
    input.w-full.rounded.border.py-1.text-center(
      type="number"
      v-model="inputToken"
      :min="exchangeMin"
      :disabled="transferInProgress"
    )
    span {{ config.eth.chain.nativeCurrency.symbol }}
    span &equals;
    .flex.items-center
      EnergyIcon.h-5
      span {{ inputEnergy }}

  template(v-if="eth.account.value")
    button.btn.btn-web3.btn-raised.w-full.gap-1(
      v-if="transferStage == TransferStage.None"
      @click="purchase"
      ref="transferButtonRef"
      :disabled="transferInProgress || inputToken < exchangeMin"
    )
      span Purchase
      .flex.items-center(class="gap-0.5")
        EnergyIcon.h-5
        span {{ inputEnergy }}

    .btn.text-base-400(v-else)
      Spinner2.h-5.w-5.animate-spin.align-middle.duration-200
      span(v-if="transferStage == TransferStage.WaitingForSignature") Waiting for signature...
      span(v-else) Waiting for tx...

    p.text-center.text-xs.leading-tight.text-base-400
      | You may also want to
      |
      button.link(@click="restore") restore
      |
      | previous purchases.

  button.btn.btn-web3.btn-raised(v-else @click="eth.connect")
    span Connect wallet
</template>
