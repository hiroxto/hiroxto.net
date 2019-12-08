<template>
  <div class="container min-h-screen text-left">
    <div class="py-8">
      <h1 class="title text-gray-800 xl:text-6xl lg:text-6xl md:text-6xl sm:text-5xl text-5xl block font-source-sans-pro">
        hiroto-k.net
      </h1>

      <h2 class="subtitle text-gray-800 xl:text-3xl lg:text-3xl md:text-3xl sm:text-2xl text-2xl pb-8 font-source-sans-pro">
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
  head () {
    return {
      title: this.title,
      titleTemplate: '',
      meta: [
        { hid: 'description', name: 'description', content: this.subTitle },
      ],
    };
  },
  computed: {
    title (): string {
      return 'hiroto-k.net';
    },
    subTitle (): string {
      return 'Home page of hiroto-k / hiroxto.';
    },
  },
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
  letter-spacing: 2px;
}

.subtitle {
  word-spacing: 2px;
}
</style>
