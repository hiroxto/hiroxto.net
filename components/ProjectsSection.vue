<template>
  <section class="section-container">
    <h3 class="section-title">
      Projects
    </h3>

    <div
      v-for="(splitProject, splitProjectsKey) in splitProjects"
      :key="splitProjectsKey"
      class="projects-list lg:flex"
    >
      <project-item
        v-for="(project, projectsKey) in splitProject"
        :key="projectsKey"
        :project="project"
        class="project-item lg:w-1/2 sm:w-full"
      >
      </project-item>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import ProjectItem from './ProjectItem';
import { Link, Project } from '~/types';

const gitHubLink = (repo: string): Link => {
  return {
    name: 'GitHub',
    to: `https://github.com/${repo}`,
  };
};

export default defineComponent({
  name: 'ProjectsSection',
  components: {
    ProjectItem,
  },
  setup () {
    const projects = computed<Project[]>((): Project[] => {
      return [
        {
          name: 'alt-tl',
          description: 'Twitterの statuses/home_timeline の代替リストを作る',
          links: [
            gitHubLink('hiroxto/alt-tl'),
          ],
          tags: ['Ruby'],
        },
        {
          name: 'anime-push',
          description: 'アニメやラジオの放送時間を Twitter や Slack で通知する',
          links: [
            gitHubLink('hiroxto/anime-push'),
          ],
          tags: ['Ruby'],
        },
        {
          name: 'anime-push-pg-plugin',
          description: 'anime-push で PostgreSQL を使うプラグイン',
          links: [
            gitHubLink('hiroxto/anime-push-pg-plugin'),
          ],
          tags: ['Ruby'],
        },
        {
          name: 'blog-notification',
          description: 'ブログの更新を Twitter や Slack で通知する',
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
          name: 'hiroto-k.net',
          description: 'www.hiroto-k.net のコード',
          links: [
            gitHubLink('hiroxto/hiroto-k.net'),
          ],
          tags: ['Vue.js', 'Nuxt.js', 'TypeScript'],
        },
        {
          name: 'utils.hiroto-k.net',
          description: '色々なユーティリティサイト',
          links: [
            gitHubLink('hiroxto/utils.hiroto-k.net'),
            {
              name: 'utils.hiroto-k.net',
              to: 'https://utils.hiroto-k.net/',
            },
          ],
          tags: ['Vue.js', 'Nuxt.js', 'TypeScript'],
        },
        {
          name: 'gas-campaign-calendar',
          description: 'スプレッドシートに入れた各種還元のキャンペーンをカレンダーに入れるスクリプト',
          links: [
            gitHubLink('hiroxto/gas-campaign-calendar'),
            {
              name: 'Blog article',
              to: 'https://hiroto-k.hatenablog.com/entry/2020/02/27/190000',
            },
          ],
          tags: ['TypeScript', 'Google Apps Script'],
        },
        {
          name: 'epgstation-slack-notification',
          description: 'EPGStation の通知を Slack に送るコマンドラインツール',
          links: [
            gitHubLink('hiroxto/epgstation-slack-notification'),
          ],
          tags: ['Go'],
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

<style lang="scss" scoped>
.projects-list {
  @apply mb-4;
}

.project-item {
  @apply mx-2 my-4;
}
</style>
