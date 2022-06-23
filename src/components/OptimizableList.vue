<template>
  <v-virtual-scroll
    v-if="optimized"
    :items="items"
    :height="height"
    :item-height="itemHeight"
    bench="100"
  >
    <template #default="{ item, index }">
      <slot
        :item="item"
        :index="index"
      />
    </template>
  </v-virtual-scroll>
  <v-list v-else>
    <slot
      v-for="(item, index) in items"
      :item="item"
      :index="index"
    />
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
      required: true,
    },
    height: {
      type: [Number, String],
      required: true,
    },
    optimized: Boolean
  },
};
</script>