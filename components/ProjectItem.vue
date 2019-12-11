<template>
  <div class="rounded shadow-lg bg-blue-100">
    <div class="px-6 py-4">
      <h4 class="font-bold text-xl mb-2 font-source-sans-pro" v-text="project.name">
      </h4>

      <p class="text-gray-700 text-base" v-text="project.description">
      </p>
    </div>

    <div class="px-6 py-4">
      <template v-if="hasLinks">
        <a
          v-for="(link, projectLinksKey) in project.links"
          :key="projectLinksKey"
          class="project-attributes bg-blue-500 rounded font-source-sans-pro"
          v-text="link.name"
          :href="link.to"
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </template>
      <template v-if="hasTags">
        <span
          v-for="(tag, projectTagsKey) in project.tags"
          :key="projectTagsKey"
          v-text="`#${tag}`"
          class="project-attributes bg-gray-500 rounded-full font-source-sans-pro"
        >
        </span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';
import { Project } from '~/types';

export default Vue.extend({
  name: 'ProjectItem',
  props: {
    project: {
      type: Object,
      required: true,
    } as PropOptions<Project>,
  },
  computed: {
    hasLinks (): boolean {
      return this.project.links !== null;
    },
    hasTags (): boolean {
      return this.project.tags !== null;
    },
  },
});
</script>

<style scoped>
.project-attributes {
  @apply text-sm text-white font-semibold inline-block px-3 py-1 mr-2 mb-2;
}
</style>
