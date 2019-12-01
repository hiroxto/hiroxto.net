<template functional>
  <div>
    <h4 v-text="title" class="text-lg text-teal-500 font-bold">
    </h4>

    <ul class="list-disc">
      <li
        v-for="(link, linksKey) in links"
        :key="linksKey"
      >
        <a
          v-text="link.name"
          :href="link.to"
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
