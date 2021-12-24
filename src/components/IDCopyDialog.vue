<template>
  <v-dialog
    scrollable
    :value="visible"
    max-width="400px"
    @input="$emit('visibility-changed', $event)"
  >
    <v-card class="id-copy-dialog">
      <v-card-title class="id-key">
        {{ idKey }}
      </v-card-title>
      <v-card-text class="id-value">
        {{ idValue }}
      </v-card-text>
      <v-card-actions>
        <v-btn
          text
          color="primary"
          class="copy-id"
          @click="copyTextAndCloseDetailDialog(idKey)"
        >
          {{ $t("idCopyDialog.copyId") }}
        </v-btn>
        <v-btn
          text
          color="primary"
          class="copy-value"
          @click="copyTextAndCloseDetailDialog(idValue)"
        >
          {{ $t("idCopyDialog.copyDescription") }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text
          color="primary"
          class="close"
          @click="copyTextAndCloseDetailDialog()"
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
    idKey: String,
    idValue: String,
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
    copyTextAndCloseDetailDialog(text) {
      this.$emit("visibility-changed", false);
      if (text) {
        this.copyText(text);
      }
    },
  },
};
</script>

<style>
</style>