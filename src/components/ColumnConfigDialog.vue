<template>
  <v-dialog
    scrollable
    :value="visible"
    max-width="500px"
    @input="$emit('visibility-changed', $event)"
  >
    <v-card class="list-column-dialog">
      <v-card-title>
        {{ $t("listColumnDialog.title") }}
      </v-card-title>
      <v-card-text>
        {{ $t("listColumnDialog.description") }}
        <v-slider
          v-model="pendingValue"
          :tick-labels="$t('listColumnDialog.labels')"
          :max="widthThresold.length - 1"
        />
        <div v-if="pendingValue > 0">
          {{
            $t("listColumnDialog.preview", [
              (columnRatio * 100).toFixed(1),
              columnCount,
            ])
          }}
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          color="primary"
          class="close"
          @click="$emit('visibility-changed', false)"
        >
          {{ $t("listColumnDialog.close") }}
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
    colWidth: {
      type: Number,
      required: true,
    },
    windowWidth: {
      type: Number,
      required: true,
    },
  },

  data: () => ({
    widthThresold: [0, 250, 350, 550],
    pendingValue: 0,
  }),

  computed: {
    columnRatio() {
      if (this.pendingValue > 0) {
        return this.widthThresold[this.pendingValue] / this.windowWidth;
      } else {
        return 1;
      }
    },
    columnCount() {
      return Math.floor(Math.max(1, 1 / this.columnRatio));
    },
  },

  watch: {
    visible(newValue) {
      if (newValue) {
        if (this.colWidth > 0) {
          for (let i = 1; i < this.widthThresold.length; i++) {
            if (this.widthThresold[i] >= this.colWidth) {
              this.pendingValue = i;
              return;
            }
          }
        }
        this.pendingValue = 0;
      } else {
        this.$emit("update", this.widthThresold[this.pendingValue]);
      }
    },
  },
};
</script>

<style>
</style>