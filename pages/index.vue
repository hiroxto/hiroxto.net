<template>
  <div class="container min-h-screen text-left">
    <div class="pt-8">
      <h1 class="title block text-6xl text-gray-800">
        hiroto-k.net
      </h1>

      <h2 class="subtitle text-2xl text-gray-800 pb-8">
        Home page of hiroto-k.
      </h2>

      <profile-content>
      </profile-content>

      <links-content>
      </links-content>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ProfileContent from '~/components/pages/index/ProfileContent';
import LinksContent from '~/components/pages/index/LinksContent';

export default Vue.extend({
  components: {
    ProfileContent,
    LinksContent,
  },
});
</script>

<style>
.container {
  margin: 0 auto;
}

.title {
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 2px;
}

.subtitle {
  word-spacing: 2px;
}
</style>
