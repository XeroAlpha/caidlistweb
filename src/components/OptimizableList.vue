<template>
  <v-virtual-scroll
    :items="items"
    :height="height"
    :item-height="itemHeight"
    bench="1"
    v-if="optimized"
  >
    <template v-slot:default="{ item, index }">
      <slot :item="item" :index="index"></slot>
    </template>
  </v-virtual-scroll>
  <v-list v-else>
    <slot v-for="(item, index) in items" :item="item" :index="index"></slot>
  </v-list>
</template>

<script>
export default {
  props: ["items", "itemHeight", "height", "optimized"],
};
</script>