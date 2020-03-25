<template>
  <div class="project-item-container">
    <div class="project-info">
      <h4 class="project-name font-source-sans-pro" v-text="project.name">
      </h4>

      <p class="project-description" v-text="project.description">
      </p>
    </div>

    <div class="project-links">
      <template v-if="hasLinks">
        <a
          v-for="(link, projectLinksKey) in project.links"
          :key="projectLinksKey"
          class="project-attributes project-link-item font-source-sans-pro"
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
          class="project-attributes project-tag-item font-source-sans-pro"
        >
        </span>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { Project } from '~/types';

interface Props {
  project: Project;
}

export default defineComponent({
  name: 'ProjectItem',
  props: {
    project: {
      type: Object,
      required: true,
    },
  },
  setup (props: Props) {
    const project = props.project;
    const hasLinks = computed<boolean>(() => project.links !== null);
    const hasTags = computed<boolean>(() => project.tags !== null);

    return {
      hasLinks,
      hasTags,
    };
  },
});
</script>

<style lang="scss" scoped>
$link-opacity: 0.6;

.project-item-container {
  @apply rounded shadow-lg bg-blue-100;
}

.project-info,
.project-links {
  @apply px-6 py-4;
}

.project-name {
  @apply font-bold text-xl mb-2;
}

.project-description {
  @apply text-gray-700 text-base;
}

.project-attributes {
  @apply text-sm text-white font-semibold inline-block px-3 py-1 mr-2 mb-2;
}

.project-link-item {
  @apply bg-blue-500 rounded;

  &:hover {
    opacity: $link-opacity;
  }

  &:active {
    background-color: #38c3e1;
    opacity: $link-opacity;
  }
}

.project-tag-item {
  @apply bg-gray-500 rounded-full;
}

@media (prefers-color-scheme: dark) {
  .project-item-container {
    @apply bg-gray-700;
  }

  .project-name {
    @apply text-gray-300;
  }

  .project-description {
    @apply text-gray-500;
  }

  .project-link-item {
    @apply bg-blue-600;
  }

  .project-tag-item {
    @apply bg-gray-600;
  }
}
</style>
