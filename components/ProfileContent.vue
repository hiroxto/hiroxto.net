<template>
  <div class="content-base md:flex">
    <div class="md:flex-shrink-0">
      <h3 class="text-xl text-purple-600 font-bold uppercase pb-4">
        Profile
      </h3>

      <img
        class="rounded-full h-20 w-20"
        src="https://avatars2.githubusercontent.com/u/12016555?s=460&v=4"
        alt="Profile image"
      >
    </div>

    <div class="mt-4 md:mt-0 md:ml-6">
      <p class="text-xl text-gray-900 font-bold pb-4">
        hiroto-k / hiroxto
      </p>

      <p class="text-gray-600">
        Description
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
