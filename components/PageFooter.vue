<template>
  <footer class="section-container">
    <p class="footer-text font-source-sans-pro">
      © 2019 hiroto-k
    </p>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'PageFooter',
});
</script>

<style lang="scss" scoped>
.footer-text {
  @apply text-xl text-black font-bold;
}
</style>
