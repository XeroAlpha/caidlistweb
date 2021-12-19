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
          复制ID
        </v-btn>
        <v-btn
          text
          color="primary"
          class="copy-value"
          @click="copyTextAndCloseDetailDialog(idValue)"
        >
          复制描述
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text
          color="primary"
          class="close"
          @click="copyTextAndCloseDetailDialog()"
        >
          关闭
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
        this.$toast(`复制“${text}”成功`);
      } catch (err) {
        this.$toast(`复制失败，请尝试在其他浏览器打开并复制`);
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