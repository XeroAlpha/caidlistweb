<template>
  <v-tooltip
    v-bind="$props"
    transition="v-fade-transition"
    :disabled="!left && !right && !top && !bottom"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        :aria-label="label"
        v-bind="{ ...attrs, ...$attrs }"
        v-on="{ ...on, ...$listeners }"
      >
        <v-icon>{{ icon }} </v-icon>
      </v-btn>
    </template>
    <span>{{ label }}</span>
  </v-tooltip>
</template>

<script>
export default {
  inheritAttrs: false,
  props: {
    left: Boolean,
    right: Boolean,
    top: Boolean,
    bottom: Boolean,
    label: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
  },
};
</script>

<style>
</style>