<template>
  <footer class="section-container">
    <p class="footer-text font-source-sans-pro">
      © 2019 hiroxto
    </p>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  name: 'PageFooter',
});
</script>

<style lang="scss" scoped>
.footer-text {
  @apply text-xl text-black font-bold;
}

@media (prefers-color-scheme: dark) {
  .footer-text {
    @apply text-gray-300;
  }
}
</style>
