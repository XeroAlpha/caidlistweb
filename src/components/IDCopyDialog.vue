<template>
  <v-dialog
    scrollable
    :value="visible"
    max-width="400px"
    @input="$emit('visibility-changed', $event)"
  >
    <v-card class="id-copy-dialog">
      <v-card-title class="id-key">
        {{ entry.key }}
      </v-card-title>
      <v-card-text class="id-value">
        {{ entry.value }}
      </v-card-text>
      <v-card-actions>
        <v-btn
          text
          color="primary"
          class="copy-id"
          @click="copyTextAndCloseDialog(entry.key)"
        >
          {{ $t("idCopyDialog.copyId") }}
        </v-btn>
        <v-btn
          text
          color="primary"
          class="copy-value"
          @click="copyTextAndCloseDialog(entry.value)"
        >
          {{ $t("idCopyDialog.copyDescription") }}
        </v-btn>
        <v-btn
          text
          color="primary"
          class="jump-to-enum"
          @click="jumpToAndCloseDialog()"
        >
          {{ $t("idCopyDialog.jumpTo") }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text
          color="primary"
          class="close"
          @click="copyTextAndCloseDialog()"
        >
          {{ $t("idCopyDialog.close") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  model: {
    prop: "visible",
    event: "visibility-changed",
  },

  props: {
    visible: Boolean,
    entry: Object,
  },

  methods: {
    async copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.$toastT("idCopyDialog.copySuccess", [text]);
      } catch (err) {
        this.$toastT("idCopyDialog.copyFailed");
      }
    },
    copyTextAndCloseDialog(text) {
      this.$emit("visibility-changed", false);
      if (text) {
        this.copyText(text);
      }
    },
    jumpToAndCloseDialog() {
      this.$emit("visibility-changed", false);
      this.$emit("jump");
    }
  },
};
</script>

<style>
</style>