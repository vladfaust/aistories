<script setup lang="ts">
import Currency from "@/components/utility/Currency.vue";
import { ethers } from "ethers";
import { computed, type Ref, ref, watch, nextTick } from "vue";
import { provider } from "@/services/eth";
import config from "@/config";
import { addRemoveClassAfterTimeout, sleep } from "@/utils";
import Spinner from "@/components/utility/Spinner2.vue";
import { createTreats } from "@/modules/treat";

const EXCHANGE_RATE = 25; // X energy for 1 value
const PRECISION = 4;

const inputEnergy = ref(100);
const inputValue = ref(inputEnergy.value / EXCHANGE_RATE);

const finalCost = computed(() => {
  return ethers.utils.parseEther(
    (inputEnergy.value / EXCHANGE_RATE).toPrecision(PRECISION).toString()
  );
});

enum TransferStage {
  None,
  WaitingForSignature,
  WaitingForConfirmation,
}

const transferStage: Ref<TransferStage> = ref(TransferStage.None);
const transferInProgress = computed(() => {
  return transferStage.value !== TransferStage.None;
});
const treatSourceRef = ref<HTMLElement | null>(null);
const transferButtonRef = ref<HTMLButtonElement | null>(null);

async function transfer() {
  if (!provider.value) throw new Error("No provider");
  if (finalCost.value.isZero()) return;

  transferStage.value = TransferStage.WaitingForSignature;

  try {
    const tx = await provider.value!.getSigner().sendTransaction({
      to: config.receiverAddress,
      value: finalCost.value,
    });

    transferStage.value = TransferStage.WaitingForConfirmation;
    await tx.wait();

    inputEnergy.value = 100;
    inputValue.value = inputEnergy.value / EXCHANGE_RATE;

    nextTick(async () => {
      addRemoveClassAfterTimeout(
        transferButtonRef.value!,
        ["animate__animated", "animate__tada"],
        1000
      );

      await sleep(200);

      createTreats(treatSourceRef.value!, ["⚡️"]);
    });
  } catch (error: any) {
    alert(error.message);
    throw error;
  } finally {
    transferStage.value = TransferStage.None;
  }
}

watch(inputValue, (val) => {
  inputEnergy.value = Math.floor(val * EXCHANGE_RATE);
});
</script>

<template lang="pug">
.flex.flex-col.items-center.justify-center.gap-2
  p.text-center.leading-tight You can also purchase energy for cryptocurrency. *

  .flex.w-full.flex-col.gap-2.rounded-lg.border.p-3
    .relative.flex.w-full.items-center.justify-center.gap-2
      .absolute(ref="treatSourceRef")

      input.grow.rounded.border.py-1.text-center(
        type="number"
        step="1"
        min="0"
        :max="10000 / EXCHANGE_RATE"
        v-model="inputValue"
        :disabled="transferInProgress"
      )
      .flex.items-center
        | MATIC = {{ inputEnergy || 0 }}
        Currency.ml-1.inline-block.h-5.w-5.shrink-0.align-text-bottom

    button.btn.btn-web3.w-full.leading-none(
      ref="transferButtonRef"
      v-if="transferStage == TransferStage.None"
      :disabled="inputEnergy <= 0 || !provider"
      @click="transfer"
    )
      | Buy {{ inputEnergy || 0 }}
      Currency.mr-1.inline-block.h-5.w-5.align-text-bottom(class="ml-0.5")
      | for {{ ethers.utils.formatEther(finalCost) }} MATIC

    .flex.w-full.items-center.justify-center.gap-2.bg-base-50.py-2.px-4.font-medium.leading-none.text-base-400(
      v-else
    )
      Spinner.h-5.w-5.animate-spin.align-middle.duration-200
      span(v-if="transferStage == TransferStage.WaitingForSignature") Waiting for signature...
      span(v-else) Waiting for tx...

  p.text-xs * Terms &amp; Conditions apply.
</template>
