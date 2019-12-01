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
