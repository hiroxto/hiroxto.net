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
import { createComponent, computed } from '@vue/composition-api';
import ProjectItem from './ProjectItem';
import { Link, Project } from '~/types';

const gitHubLink = (repo: string): Link => {
  return {
    name: 'GitHub',
    to: `https://github.com/${repo}`,
  };
};

export default createComponent({
  name: 'ProjectsContent',
  components: {
    ProjectItem,
  },
  setup () {
    const projects = computed<Project[]>((): Project[] => {
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
    });

    const projectsLength = computed<number>((): number => projects.value.length);
    const projectSplitUnit = computed<number>((): number => 2);
    const splitProjects = computed<Project[][]>((): Project[][] => {
      const projectsValue = projects.value;
      const projectsLengthValue = projectsLength.value;
      const projectSplitUnitValue = projectSplitUnit.value;
      const splitProject: Project[][] = [];

      for (let i = 0; i < projectsLengthValue; i += projectSplitUnitValue) {
        splitProject.push(projectsValue.slice(i, i + projectSplitUnitValue));
      }

      return splitProject;
    });

    return {
      splitProjects,
    };
  },
});
</script>
