<template>
  <v-tooltip
    v-bind="$props"
    transition="v-fade-transition"
    :disabled="!isHoverable || !tooltip"
  >
    <template #activator="{ on, attrs }">
      <v-list-item
        v-bind="{ ...attrs, ...$attrs }"
        v-on="{ ...on, ...$listeners }"
      >
        <slot />
      </v-list-item>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script>
export default {
  inheritAttrs: false,
  props: {
    left: Boolean,
    right: Boolean,
    tooltip: {
      type: String,
      default: "",
    },
  },
  computed: {
    isHoverable() {
      return matchMedia("(hover: hover)").matches;
    },
  },
};
</script>

<style>
</style>