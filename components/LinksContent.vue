<template>
  <div class="content-base">
    <div>
      <h3 class="content-title">
        Links
      </h3>

      <link-list
        v-for="(linkList, linkListsKey) in linkLists"
        :key="linkListsKey"
        :title="linkList.title"
        :links="linkList.links"
        class="py-2"
      >
      </link-list>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import LinkList from './LinkList';
import { Link } from '~/types';

interface LinkListProperty {
  title: string;
  links: Link[];
}

export default Vue.extend({
  name: 'LinksContent',
  components: {
    LinkList,
  },
  computed: {
    linkLists (): LinkListProperty[] {
      return [
        {
          title: 'SNS, etc..',
          links: this.otherServiceLinks,
        },
        {
          title: 'Sub domains',
          links: this.subDomainLinks,
        },
        {
          title: 'Blogs',
          links: this.blogLinks,
        },
      ];
    },
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
    blogLinks (): Link[] {
      return [
        {
          name: 'Main blog',
          to: 'https://hiroto-k.hatenablog.com/',
        },
        {
          name: 'Train photo blog',
          to: 'https://train-photo-blog.hiroto-k.net/',
        },
      ];
    },
  },
});
</script>

<style scoped>
</style>
