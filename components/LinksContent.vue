<template>
  <div class="bg-white py-6 px-6">
    <div>
      <h3 class="text-xl text-purple-600 font-bold uppercase">
        Links
      </h3>

      <h4 class="text-lg text-teal-500 font-bold">
        Sub domains
      </h4>

      <ul class="list-disc">
        <li
          v-for="(subDomainLink, subDomainLinksKey) in subDomainLinks"
          :key="subDomainLinksKey"
        >
          <a
            v-text="subDomainLink.name"
            :href="subDomainLink.to"
          >
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Link } from '~/types';

export default Vue.extend({
  name: 'LinksContent',
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
