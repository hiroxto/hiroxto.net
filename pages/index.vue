<template>
  <div class="container min-h-screen text-left">
    <div class="py-8">
      <h1 class="title block text-6xl text-gray-800">
        hiroto-k.net
      </h1>

      <h2 class="subtitle text-3xl text-gray-800 pb-8">
        Home page of hiroto-k.
      </h2>

      <profile-content>
      </profile-content>

      <separator size="5">
      </separator>

      <links-content>
      </links-content>

      <separator size="5">
      </separator>

      <projects-content>
      </projects-content>

      <separator size="5">
      </separator>

      <page-footer>
      </page-footer>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ProfileContent from '~/components/ProfileContent';
import LinksContent from '~/components/LinksContent';
import ProjectsContent from '~/components/ProjectsContent';
import Separator from '~/components/Separator';
import PageFooter from '~/components/PageFooter';

export default Vue.extend({
  components: {
    ProfileContent,
    LinksContent,
    ProjectsContent,
    Separator,
    PageFooter,
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
