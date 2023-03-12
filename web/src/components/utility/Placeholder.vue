<script setup lang="ts">
const { animated } = withDefaults(defineProps<{ animated?: boolean }>(), {
  animated: true,
});
</script>

<template lang="pug">
div(:class="{ 'animate-pulse': animated }")
  slot
</template>
