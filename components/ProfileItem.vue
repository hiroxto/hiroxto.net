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
import { defineComponent, PropType } from '@nuxtjs/composition-api';

export default defineComponent({
  name: 'ProfileItem',
  props: {
    title: {
      type: String,
      required: true,
    } as PropType<string>,
    singleText: {
      type: Boolean,
      default (): boolean {
        return false;
      },
    } as PropType<boolean>,
  },
});
</script>

<style lang="scss" scoped>
.profile-item {
  @apply mb-2;
}

.profile-item-title {
  @apply text-xl text-gray-900 font-medium my-1;
}

.profile-item-text {
  @apply text-gray-600;
}

@media (prefers-color-scheme: dark) {
  .profile-item-title {
    @apply text-gray-300;
  }

  .profile-item-text {
    @apply text-gray-500;
  }
}
</style>
