<template>
  <div class="container min-h-screen text-left">
    <div class="py-8">
      <h1
        class="text-gray-800 xl:text-4xl lg:text-4xl md:text-4xl sm:text-3xl text-3xl font-source-sans-pro"
        v-text="title"
      >
      </h1>

      <h2
        class="text-gray-800 xl:text-2xl lg:text-2xl md:text-2xl sm:text-xl text-xl pb-8 font-source-sans-pro"
        v-text="subtitle"
      >
      </h2>

      <div class="content-base font-source-sans-pro">
        <p class="content-text">
          Sorry.
          This page doesn't exist.
        </p>

        <p class="content-text">
          Please
          <nuxt-link to="/" class="text-green-600">
            back to top page.
          </nuxt-link>
        </p>
      </div>

      <separator size="5">
      </separator>

      <page-footer>
      </page-footer>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Separator from '~/components/Separator';
import PageFooter from '~/components/PageFooter';

export default Vue.extend({
  head () {
    return {
      title: this.title,
    };
  },
  computed: {
    title (): string {
      return '404 Not Found';
    },
    subtitle (): string {
      return 'hiroto-k.net';
    },
  },
  components: {
    Separator,
    PageFooter,
  },
});
</script>

<style scoped>
.content-text {
  @apply text-lg text-black;
}
</style>
