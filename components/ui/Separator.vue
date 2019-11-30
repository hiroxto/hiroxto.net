<template>
  <div :class="className">
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue';

export default Vue.extend({
  name: 'Separator',
  props: {
    size: {
      type: String,
      required: false,
      default () {
        return '5';
      },
    } as PropOptions<string>,
  },
  computed: {
    className (): string {
      return `py-${this.size}`;
    },
  },
});
</script>
