<script setup lang="ts">
import { type Ref, ref, onMounted, watch } from "vue";
import * as jdenticon from "jdenticon";

const props = defineProps<{ input: any }>();

const svgRef: Ref<SVGElement | null> = ref(null);

function updateSvg() {
  jdenticon.updateSvg(svgRef.value!, props.input);
}

onMounted(() => {
  updateSvg();
});

watch(
  () => props.input,
  () => {
    updateSvg();
  }
);
</script>

<template lang="pug">
svg(ref="svgRef")
</template>
