<template>
  <div class="content-base">
    <div>
      <h3 class="content-title">
        Projects
      </h3>

      <div
        v-for="(splitProject, splitProjectsKey) in splitProjects"
        :key="splitProjectsKey"
        class="lg:flex mb-4"
      >
        <project-item
          v-for="(project, projectsKey) in splitProject"
          :key="projectsKey"
          :project="project"
          class="lg:w-1/2 sm:w-full mx-2 my-4"
        >
        </project-item>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ProjectItem from './ProjectItem';
import { Link, Project } from '~/types';

const gitHubLink = (repo: string): Link => {
  return {
    name: 'GitHub',
    to: `https://github.com/${repo}`,
  };
};

export default Vue.extend({
  name: 'ProjectsContent',
  components: {
    ProjectItem,
  },
  computed: {
    projectsLength (): number {
      return this.projects.length;
    },
    projectSplitUnit (): number {
      return 2;
    },
    splitProjects (): Project[][] {
      const projects = this.projects;
      const projectsLength = this.projectsLength;
      const splitUnit = this.projectSplitUnit;
      const splitProject: Project[][] = [];

      for (let i = 0; i < projectsLength; i += splitUnit) {
        splitProject.push(projects.slice(i, i + splitUnit));
      }

      return splitProject;
    },
    projects (): Project[] {
      return [
        {
          name: 'alt-tl',
          description: 'Twitterの statuses/home_timeline の代替リストを作る。',
          links: [
            gitHubLink('hiroxto/alt-tl'),
          ],
          tags: ['Ruby'],
        },
        {
          name: 'anime-push',
          description: 'アニメやラジオの放送時間をTwitterやSlackで通知する。',
          links: [
            gitHubLink('hiroxto/anime-push'),
          ],
          tags: ['Ruby'],
        },
        {
          name: 'anime-push-pg-plugin',
          description: 'anime-pushでPostgreSQLを使うプラグイン',
          links: [
            gitHubLink('hiroxto/anime-push-pg-plugin'),
          ],
          tags: ['Ruby'],
        },
        {
          name: 'blog-notification',
          description: 'ブログの更新をTwitterやSlackで通知する。',
          links: [
            gitHubLink('hiroxto/blog-notification'),
          ],
          tags: ['Ruby'],
        },
        {
          name: 'console-wrapper',
          description: 'symfony/consoleのラッパー',
          links: [
            gitHubLink('hiroxto/console-wrapper'),
            {
              name: 'Documents',
              to: 'https://github.com/hiroxto/console-wrapper#documents',
            },
            {
              name: 'Packagist',
              to: 'https://packagist.org/packages/hiroto-k/console-wrapper',
            },
          ],
          tags: ['PHP', 'Library'],
        },
        {
          name: 'php-string-builder',
          description: 'PHP用のString builder',
          links: [
            gitHubLink('hiroxto/php-string-builder'),
            {
              name: 'Packagist',
              to: 'https://packagist.org/packages/hiroto-k/string-builder',
            },
          ],
          tags: ['PHP', 'Library'],
        },
        {
          name: 'itunes-playlist-converter',
          description: 'iTunesのプレイリストをDAP向けに変換。',
          links: [
            gitHubLink('hiroxto/itunes-playlist-converter'),
          ],
          tags: ['Ruby'],
        },
        {
          name: 'utils.hiroto-k.net',
          description: '色々なユーティリティサイト',
          links: [
            gitHubLink('hiroxto/utils.hiroto-k.net'),
          ],
          tags: ['Vue.js', 'Nuxt.js', 'TypeScript'],
        },
      ];
    },
  },
});
</script>
