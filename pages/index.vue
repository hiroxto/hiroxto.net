<template>
  <div class="container min-h-screen text-left">
    <div class="py-8">
      <h1
        class="title text-gray-800 xl:text-6xl lg:text-6xl md:text-6xl sm:text-5xl text-5xl block font-source-sans-pro"
        v-text="title"
      >
      </h1>

      <h2
        class="subtitle text-gray-800 xl:text-3xl lg:text-3xl md:text-3xl sm:text-2xl text-2xl pb-8 font-source-sans-pro"
        v-text="subTitle"
      >
      </h2>

      <profile-section>
      </profile-section>

      <separator size="5">
      </separator>

      <links-section>
      </links-section>

      <separator size="5">
      </separator>

      <projects-section>
      </projects-section>

      <separator size="5">
      </separator>

      <page-footer>
      </page-footer>
    </div>
  </div>
</template>

<script lang="ts">
import ProfileSection from '~/components/ProfileSection';
import LinksSection from '~/components/LinksSection';
import ProjectsSection from '~/components/ProjectsSection';
import Separator from '~/components/Separator';
import PageFooter from '~/components/PageFooter';
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
  head () {
    return {
      title: this.title,
      titleTemplate: '',
      meta: [
        { hid: 'description', name: 'description', content: this.subTitle },
      ],
      link: [
        { rel: 'canonical', href: '/' },
      ],
    };
  },
  setup () {
    const title = computed(() => 'hiroto-k.net');
    const subTitle = computed(() => 'Home page of hiroto-k / hiroxto.');

    return {
      title,
      subTitle,
    };
  },
  components: {
    ProfileSection,
    LinksSection,
    ProjectsSection,
    Separator,
    PageFooter,
  },
});
</script>

<style>
.title {
  letter-spacing: 2px;
}

.subtitle {
  word-spacing: 2px;
}
</style>
