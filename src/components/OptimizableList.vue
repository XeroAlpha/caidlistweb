<template>
  <v-virtual-scroll
    v-if="optimized"
    :items="rows"
    :height="height"
    :item-height="itemHeight"
    bench="30"
  >
    <template #default="{ item: row }">
      <div class="optimized-list-row">
        <div
          v-for="index in colCount"
          :key="index"
          class="optimized-list-cell"
        >
          <slot
            v-if="index <= row.length"
            :item="row[index - 1]"
          />
        </div>
      </div>
    </template>
  </v-virtual-scroll>
  <v-list
    v-else
    class="optimized-list-wrap"
  >
    <div
      v-for="(item, index) in items"
      :key="index"
      class="optimized-list-cell"
      :style="cellStyle"
    >
      <slot :item="item" />
    </div>
  </v-list>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    itemHeight: {
      type: [Number, String],
      default: "0px",
    },
    height: {
      type: [Number, String],
      default: "0px",
    },
    cols: {
      type: Number,
      default: 1,
    },
    optimized: Boolean,
  },
  computed: {
    rows() {
      const { items, colCount } = this;
      const rows = [];
      for (let i = 0; i < items.length; i += colCount) {
        rows.push(items.slice(i, i + colCount));
      }
      return rows;
    },
    colCount() {
      return Math.floor(Math.max(1, this.cols)) || 1;
    },
    cellStyle() {
      return { maxWidth: 100 / this.colCount + "%" };
    }
  },
};
</script>

<style scoped>
.optimized-list-wrap {
  display: flex;
  flex-flow: row wrap;
}
.optimized-list-row {
  display: flex;
  flex-flow: row nowrap;
}
.optimized-list-cell {
  flex: 1 1 100%;
  width: 0;
}
</style>