<template>
  <div class="profile-item">
    <h4 class="profile-item-title" v-text="title">
    </h4>

    <template v-if="singleText">
      <p class="profile-item-text">
        <slot>
        </slot>
      </p>
    </template>
    <template v-else>
      <slot>
      </slot>
    </template>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';

export default Vue.extend({
  name: 'ProfileItem',
  props: {
    title: {
      type: String,
      required: true,
    } as PropOptions<string>,
    singleText: {
      type: Boolean,
      default (): boolean {
        return false;
      },
    } as PropOptions<boolean>,
  },
});
</script>

<style scoped>

</style>
