<template>
  <div class="bg-white md:flex py-6 px-6">
    <div class="md:flex-shrink-0">
      <img
        class="rounded-full h-20 w-20"
        src="https://avatars2.githubusercontent.com/u/12016555?s=460&v=4"
        alt="Profile image"
      >
    </div>

    <div class="mt-4 md:mt-0 md:ml-6">
      <div class="text-lg text-purple-600 font-bold">
        Profile
      </div>

      <p class="text-lg text-gray-900 font-bold block mt-1 leading-tight">
        hiroto-k / hiroxto
      </p>

      <p class="mt-2 text-gray-600">
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ProfileContent',
});
</script>

<style scoped>

</style>
