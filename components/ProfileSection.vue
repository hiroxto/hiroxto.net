<template>
  <section class="section-container md:flex">
    <div class="md:flex-shrink-0">
      <h3 class="section-title pb-4">
        Profile
      </h3>

      <img
        class="profile-image"
        src="/profile.png"
        alt="Profile image"
      >
    </div>

    <div class="mt-4 md:mt-0 md:ml-6">
      <p class="profile-name font-source-sans-pro" v-text="name">
      </p>

      <profile-item title="Likes" :single-text="true">
        {{ likes }}
      </profile-item>

      <profile-item title="プログラミング">
        <p class="profile-item-text" v-text="programming">
        </p>
        <p class="profile-item-text">
          普段は PHP と Ruby を書きつつ, JavaScript / TypeScriptを使った Vue.js や Nuxt.js も書きます。
          最近は Golang なども｡
        </p>
        <p class="profile-item-text">
          エディタは VSCode と JetBrains 系の IDE を使ってます。
        </p>
      </profile-item>

      <profile-item title="アニメ" :single-text="true">
        適当に色々と見ています。
      </profile-item>

      <profile-item title="ラーメン" :single-text="true">
        4 日間連続で昼夜に食べられるくらいには好きです。(朝からラーメンとか, 5 日連続ラーメンとかは普通に嫌。)
      </profile-item>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import ProfileItem from './ProfileItem';

export default defineComponent({
  name: 'ProfileSection',
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

    return {
      name,
      likes,
      programming,
    };
  },
});
</script>

<style lang="scss" scoped>
.profile-image {
  @apply rounded-full h-20 w-20;
}

.profile-name {
  @apply text-2xl text-gray-900 font-bold pb-4;
}

@media (prefers-color-scheme: dark) {
  .profile-name {
    @apply text-gray-300;
  }
}
</style>
