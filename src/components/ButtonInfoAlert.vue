<template>
  <v-alert
    outlined
    text
    type="info"
    class="mb-0"
  >
    <v-row align="center">
      <v-col class="grow">
        <slot />
      </v-col>
      <v-col
        v-if="button"
        class="shrink pa-0 pr-3"
      >
        <v-btn
          link
          text
          color="info"
          class="alert-action"
          :href="href"
          @click="$emit('click')"
        >
          {{ buttonText }}
        </v-btn>
      </v-col>
    </v-row>
  </v-alert>
</template>

<script>
export default {
  props: {
    button: Boolean,
    buttonText: {
      type: String,
      default: "",
    },
    href: {
      type: String,
      default: "",
    },
  },
};
</script>

<style>
</style>