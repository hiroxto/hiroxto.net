<template>
  <section>
    <h4 v-text="title" class="links-list-title font-source-sans-pro">
    </h4>

    <ul class="list-none p-0 relative">
      <li
        v-for="(link, linksKey) in links"
        :key="linksKey"
        class="links-list-item"
      >
        <a
          v-text="link.name"
          :href="link.to"
          target="_blank"
          rel="noopener noreferrer"
          class="links-list-item-link"
        >
        </a>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { Link } from '~/types';

interface Props {
  title: string;
  links: Link[];
}

export default defineComponent({
  name: 'LinkList',
  props: {
    title: {
      type: String,
      required: true,
    },
    links: {
      type: Array,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
$link-opacity: 0.6;

.links-list-title {
  @apply text-lg text-teal-500 font-bold;
}

.links-list-item {
  @apply text-black bg-gray-100 rounded-lg shadow-lg my-2 p-2 leading-snug;

  border-left: solid 0.5rem #ffa44b;
}

.links-list-item-link {
  &:hover {
    color: #1b64df;
    opacity: $link-opacity;
  }

  &:active {
    background-color: #7f828b;
    color: #fff;
    opacity: $link-opacity;
  }
}

@media (prefers-color-scheme: dark) {
  .links-list-item {
    @apply bg-gray-700 text-gray-300;
  }

  .links-list-item-link {
    &:active {
      background-color: #000;
    }
  }
}
</style>
