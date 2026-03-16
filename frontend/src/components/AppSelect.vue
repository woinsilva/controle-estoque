<template>
  <Select
    :modelValue="modelValue"
    :options="options"
    :optionLabel="optionLabel"
    :optionValue="optionValue"
    :optionDisabled="optionDisabled"
    :placeholder="placeholder"
    :disabled="disabled"
    :showClear="showClear"
    :filter="filter"
    :filterFields="resolvedFilterFields"
    class="app-select"
    @update:modelValue="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
    @blur="$emit('blur', $event)"
  />
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from 'vue';
import Select from 'primevue/select';

export default defineComponent({
  name: 'AppSelect',
  components: { Select },
  props: {
    modelValue: {
      type: [String, Number, Boolean, Object, null],
      default: ''
    },
    options: {
      type: Array as PropType<Array<Record<string, unknown>>>,
      default: () => []
    },
    optionLabel: {
      type: String,
      default: 'label'
    },
    optionValue: {
      type: String,
      default: 'value'
    },
    optionDisabled: {
      type: String,
      default: 'disabled'
    },
    placeholder: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showClear: {
      type: Boolean,
      default: false
    },
    filter: {
      type: Boolean,
      default: true
    },
    filterFields: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'change', 'blur'],
  setup(props) {
    const resolvedFilterFields = computed(() =>
      props.filterFields.length ? props.filterFields : [props.optionLabel]
    );

    return {
      resolvedFilterFields
    };
  }
});
</script>

<style scoped>
.app-select {
  width: 100%;
}
</style>
