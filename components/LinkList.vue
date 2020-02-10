<template>
  <div>
    <h4 v-text="title" class="text-lg text-teal-500 font-bold font-source-sans-pro">
    </h4>

    <ul class="list-none p-0 relative">
      <li
        v-for="(link, linksKey) in links"
        :key="linksKey"
        class="links-list-item text-black bg-gray-100 rounded-lg shadow-lg my-2 p-2 leading-snug"
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
  </div>
</template>

<script lang="ts">
import { createComponent } from '@vue/composition-api';
import { Link } from '~/types';

interface Props {
  title: string;
  links: Link[];
}

export default createComponent({
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
  setup (props: Props) {
    return {
      title: props.title,
      links: props.links,
    };
  },
});
</script>

<style lang="scss" scoped>
$link-opacity: 0.6;

.links-list-item {
  border-left: solid 0.5rem #ffa44b;
}

.links-list-item-link {
  &:hover {
    color: #1B64DF;
    opacity: $link-opacity;
  }

  &:active {
    background-color: #7f828b;
    color: #ffffff;
    opacity: $link-opacity;
  }
}
</style>
