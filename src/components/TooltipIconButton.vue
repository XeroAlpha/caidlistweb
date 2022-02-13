<template>
  <v-tooltip
    v-bind="$props"
    transition="v-fade-transition"
    :disabled="!left && !right && !top && !bottom"
  >
    <template v-slot:activator="{ on, attrs }">
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
  props: {
    left: Boolean,
    right: Boolean,
    top: Boolean,
    bottom: Boolean,
    label: String,
    icon: String,
  },
  inheritAttrs: false,
};
</script>

<style>
</style>