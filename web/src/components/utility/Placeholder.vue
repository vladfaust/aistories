<script setup lang="ts">
const { animated = true } = defineProps<{
  animated?: boolean;
}>();
</script>

<template lang="pug">
div(:class="{ 'animate-pulse': animated }")
  slot
</template>
