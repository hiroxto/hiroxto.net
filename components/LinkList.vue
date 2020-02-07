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
import Vue, { PropOptions } from 'vue';
import { Link } from '~/types';

export default Vue.extend({
  name: 'LinkList',
  props: {
    title: {
      type: String,
      required: true,
    } as PropOptions<string>,
    links: {
      type: Array,
      required: true,
    } as PropOptions<Link[]>,
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
