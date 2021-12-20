<template>
  <v-tooltip
    v-bind="$props"
    transition="v-fade-transition"
    :disabled="!tooltip"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-list-item
        v-bind="{ ...attrs, ...$attrs }"
        v-on="{ ...on, ...$listeners }"
      >
        <slot></slot>
      </v-list-item>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script>
export default {
  props: {
    left: Boolean,
    right: Boolean,
    tooltip: {
      type: String,
      required: false,
    },
  },
  inheritAttrs: false,
};
</script>

<style>
</style>