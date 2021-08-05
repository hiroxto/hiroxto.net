<template>
  <div class="container">
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

      <div class="section-container font-source-sans-pro">
        <p class="content-text">
          Sorry.
          This page doesn't exist.
        </p>

        <p class="content-text">
          Please
          <nuxt-link to="/" class="text-green-600 hover:text-green-300">
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
import { defineComponent, computed } from '@nuxtjs/composition-api';
import Separator from '~/components/Separator';
import PageFooter from '~/components/PageFooter';

export default defineComponent({
  head () {
    return {
      title: this.title,
      meta: [
        { hid: 'description', name: 'description', content: `${this.title} - ${this.subtitle}` },
        { hid: 'robots', name: 'robots', content: 'noindex,nofollow' },
      ],
    };
  },
  setup () {
    const title = computed<string>(() => '404 Not Found');
    const subtitle = computed<string>(() => 'hiroxto.net');

    return {
      title,
      subtitle,
    };
  },
  components: {
    Separator,
    PageFooter,
  },
});
</script>

<style lang="scss" scoped>
.content-text {
  @apply text-lg text-black;
}
</style>
