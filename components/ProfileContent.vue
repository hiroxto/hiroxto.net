<template>
  <section class="content-base md:flex">
    <div class="md:flex-shrink-0">
      <h3 class="content-title pb-4">
        Profile
      </h3>

      <img
        class="rounded-full h-20 w-20"
        src="/profile.png"
        alt="Profile image"
      >
    </div>

    <div class="mt-4 md:mt-0 md:ml-6">
      <p class="text-2xl text-gray-900 font-bold pb-4 font-source-sans-pro" v-text="name">
      </p>

      <profile-item title="Likes" :single-text="true">
        {{ likes }}
      </profile-item>

      <profile-item title="プログラミング">
        <p class="profile-item-text" v-text="programming">
        </p>
        <p class="profile-item-text">
          普段はPHPとRubyを書きつつ、JavaScript/TypeScriptを使ったVue.jsやNuxt.jsも書きます。
        </p>
        <p class="profile-item-text">
          エディタはVSCodeとJetBrains系のIDEを使ってます。
        </p>
      </profile-item>

      <profile-item title="アニメ" :single-text="true">
        適当に色々と見ています。
      </profile-item>

      <profile-item title="声優">
        <p class="profile-item-text">
          言うほど声優オタクではありませんが、主に以下の方々が好きです。
        </p>

        <ul class="list-disc ml-5">
          <li
            v-for="(voiceActorName, voiceActorNamesKey) in voiceActorNames"
            :key="voiceActorNamesKey"
            v-text="voiceActorName"
            class="profile-item-text leading-normal"
          >
          </li>
        </ul>
      </profile-item>

      <profile-item title="ゲーム" :single-text="true">
        8 beat Story♪とCUE!だけはまともにやっています。リステは曲だけ追っかけ。
      </profile-item>

      <profile-item title="写真" :single-text="true">
        たまに鉄道写真や風景写真を撮ります。電車おたくは他界気味なので最近はあまり撮らず。撮りたい被写体を適当に撮っています。
      </profile-item>

      <profile-item title="ラーメン" :single-text="true">
        4日間連続で昼夜に食べられるくらいには好きです。(朝からラーメンとか、5日連続ラーメンとかは普通に嫌。)
      </profile-item>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import ProfileItem from './ProfileItem';

export default defineComponent({
  name: 'ProfileContent',
  components: {
    ProfileItem,
  },
  setup () {
    const name = computed<string>(() => 'hiroto-k / hiroxto');
    const joinSeparator = ', ';
    const likes = computed<string>(() => {
      return [
        'プログラミング',
        'アニメ',
        '声優',
        'ゲーム',
        '写真',
        'ラーメン',
        'etc...',
      ].join(joinSeparator);
    });
    const programming = computed<string>(() => {
      return [
        'PHP',
        'Ruby',
        'JavaScript',
        'Laravel',
        'Vue.js',
        'Nuxt.js',
      ].join(joinSeparator);
    });
    const voiceActorNames = computed<string[]>(() => {
      return [
        '大橋彩香',
        '安齋由香里',
        '小澤亜李',
        '嶺内ともみ',
        '和氣あず未',
      ].map((name: string): string => {
        return `${name}さん`;
      });
    });

    return {
      name,
      likes,
      programming,
      voiceActorNames,
    };
  },
});
</script>

<style scoped>

</style>
