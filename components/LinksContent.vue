<template>
  <div class="bg-white py-6 px-6">
    <div>
      <h3 class="text-xl text-purple-600 font-bold uppercase">
        Links
      </h3>

      <link-list title="Sub domains" :links="subDomainLinks">
      </link-list>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import LinkList from './LinkList';
import { Link } from '~/types';

export default Vue.extend({
  name: 'LinksContent',
  components: {
    LinkList,
  },
  computed: {
    otherServiceLinks (): Link[] {
      return [
        {
          name: 'Twitter (hiroto_k_)',
          to: 'https://twitter.com/hiroto_k_',
        },
        {
          name: 'GitHub (hiroxto)',
          to: 'https://github.com/hiroxto',
        },
        {
          name: 'GitLab (hiroxto)',
          to: 'https://gitlab.com/hiroxto',
        },
      ];
    },
    subDomainLinks (): Link[] {
      return [
        {
          name: 'utils.hiroto-k.net',
          to: 'https://utils.hiroto-k.net/',
        },
        {
          name: 'train-photo-blog.hiroto-k.net',
          to: 'https://train-photo-blog.hiroto-k.net/',
        },
      ];
    },
  },
});
</script>

<style scoped>
</style>
