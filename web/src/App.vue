<script setup lang="ts">
import { onMounted } from "vue";
import HeaderVue from "@/components/Header.vue";
import { autoConnect } from "@/services/eth";
import { useRoute } from "vue-router";

const route = useRoute();

onMounted(autoConnect);
</script>

<template lang="pug">
HeaderVue
.flex.w-full.place-content-center.p-4
  .w-full.max-w-3xl
    RouterView(v-slot="{ Component }")
      Transition(name="fade" mode="out-in")
        Component(:is="Component" :key="route.path")
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
</style>
