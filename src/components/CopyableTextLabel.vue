<template>
  <span
    class="copyable-label"
    @touchstart="touchDown()"
    @touchend="touchUp()"
    @touchcancel="touchUp()"
  >
    <span class="copyable-flex">
      <span class="copyable-text">{{ text }}</span>
      <v-btn
        icon
        tile
        plain
        x-small
        class="copyable-copy"
        :label="$t('copyableTextLabel.copy')"
        @click="copy()"
      >
        <v-icon>mdi-content-copy</v-icon>
      </v-btn>
    </span>
  </span>
</template>

<script>
export default {
  props: {
    text: String,
  },
  data: () => ({
    touching: false,
    touchTimeout: -1,
  }),
  methods: {
    copy() {
      return this.$copyText(this.text);
    },
    touchDown() {
      this.touching = true;
      this.touchTimeout = setTimeout(() => this.copy(), 1000);
      console.log("touchDown");
    },
    touchUp() {
      if (this.touching) {
        this.touching = false;
        clearTimeout(this.touchTimeout);
      }
      console.log("touchUp");
    },
  },
};
</script>

<style>
.copyable-label {
  display: flex;
}
.copyable-label .copyable-flex {
  flex: 1 1 0%;
}
.copyable-label .copyable-text {
  word-break: break-all;
  user-select: all;
}
.copyable-label .copyable-copy {
  margin-left: 4px;
}
.copyable-label .copyable-copy {
  display: none;
}
@media (hover: hover) {
  .copyable-label .copyable-text {
    user-select: unset;
  }
  .copyable-label:hover .copyable-copy {
    display: unset;
  }
}
</style>