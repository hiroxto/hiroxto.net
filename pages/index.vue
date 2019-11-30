<template>
  <div class="container flex min-h-screen text-left">
    <div>
      <h1 class="title block text-6xl text-gray-800">
        hiroto-k.net
      </h1>

      <h2 class="subtitle text-2xl text-gray-800 pb-8">
        Home page of hiroto-k.
      </h2>

      <profile-content>
      </profile-content>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ProfileContent from '~/components/pages/index/ProfileContent';

export default Vue.extend({
  components: {
    ProfileContent,
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
