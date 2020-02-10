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
import { createComponent } from '@vue/composition-api';

interface Props {
  title: string;
  singleText: boolean;
}

export default createComponent({
  name: 'ProfileItem',
  props: {
    title: {
      type: String,
      required: true,
    },
    singleText: {
      type: Boolean,
      default (): boolean {
        return false;
      },
    },
  },
});
</script>

<style scoped>

</style>
