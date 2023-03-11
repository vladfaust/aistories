<script setup lang="ts">
import HeaderVue from "@/components/Header.vue";
import FooterVue from "@/components/Footer.vue";
import { useRoute } from "vue-router";
import "animate.css";
import { onMounted } from "vue";
import * as api from "@/services/api";
import { userId, energy } from "./store";
import * as eth from "@/services/eth";

const route = useRoute();

onMounted(() => {
  eth.autoConnect();

  api.trpc.commands.me.getId.query().then((id) => {
    userId.value = id;

    if (id) {
      api.trpc.commands.me.energy.get.query().then((res) => {
        energy.value = res;

        api.trpc.subscriptions.me.onEnergy.subscribe(undefined, {
          onData: (res) => {
            energy.value = energy.value + res.delta;
          },
        });
      });
    }
  });
});
</script>

<template lang="pug">
HeaderVue
.flex.justify-center.p-4(style="min-height: calc(100vh - 8rem)")
  RouterView(v-slot="{ Component }")
    Transition(name="fade" mode="out-in")
      Component(:is="Component" :key="route.path")
FooterVue
</template>

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  transition: opacity 0.1s ease-in;
  opacity: 0;
}

.treat {
  --scale-x: 0;
  --scale-y: 0;

  pointer-events: none;
  display: block;
  position: absolute;
  top: 0;
  left: calc(50% - 0.5rem);
  border-radius: 50%;
  width: 1em;
  height: 1em;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 5vmin;
  transform: translate(calc(var(--x) * 1px), calc(var(--y) * 1px))
    translate(-50%, -50%);
  pointer-events: none;
  animation: treat-enter 0.1s ease-in backwards,
    treat-exit 300ms linear calc((var(--lifetime, 3000) * 1ms) - 300ms) forwards;

  @keyframes treat-enter {
    from {
      opacity: 0;
    }
  }

  @keyframes treat-exit {
    to {
      opacity: 0;
    }
  }

  .inner {
    animation: inner-rotate 0.6s linear infinite;
    transform: rotate(calc(-1turn * var(--direction)));

    @keyframes inner-rotate {
      to {
        transform: none;
      }
    }
  }
}
</style>
