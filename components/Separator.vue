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
      const pyClassName = `py-${this.size}`;
      const allowClasses = [
        'py-0',
        'py-1',
        'py-2',
        'py-3',
        'py-4',
        'py-5',
        'py-6',
        'py-8',
        'py-10',
        'py-12',
        'py-16',
        'py-20',
        'py-24',
        'py-32',
        'py-40',
        'py-48',
        'py-56',
        'py-64',
        'py-px',
      ];

      return allowClasses.includes(pyClassName) ? pyClassName : 'py-5';
    },
  },
});
</script>
