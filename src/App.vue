<template>
  <v-app>
    <v-app-bar app outlined flat>
      <v-text-field
        id="search_box"
        outlined
        flat
        dense
        single-line
        clearable
        hide-details="auto"
        prepend-icon="mdi-magnify"
        v-model="searchText"
        @input="computeSearchResult"
        @focus="searchBoxFocus = true"
        @blur="searchBoxFocus = false"
      ></v-text-field>
      <v-menu>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            outlined
            dense
            :loading="loading"
            height="40px"
            class="ml-3"
            style="padding-right: 8px"
            v-bind="attrs"
            v-on="on"
          >
            {{ selectedEnumMeta.title }}
            <v-icon class="ml-2">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list class="overflow-y-auto" max-height="90vh">
          <v-list-item-group
            v-model="selectedEnumIndex"
            mandatory
            color="primary"
            @change="computeSearchResult"
          >
            <v-list-item
              v-for="(enumName, i) in enumNamesForList"
              :key="i"
              @click="focusSearchBox(), (selectingEnum = false)"
            >
              <v-list-item-title>{{ enumName }}</v-list-item-title>
            </v-list-item>
          </v-list-item-group>
          <v-divider></v-divider>
          <v-list-item disabled>
            <v-list-item-title> 版本：{{ version }} </v-list-item-title>
          </v-list-item>
          <v-list-item href="./latest.zip">
            <v-list-item-title>离线版</v-list-item-title>
          </v-list-item>
          <v-list-item href="https://jq.qq.com/?_wv=1027&k=RcLgagPy">
            <v-list-item-title>问题反馈</v-list-item-title>
          </v-list-item>
          <v-list-item href="https://gitee.com/projectxero/caidlist">
            <v-list-item-title>关于</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-progress-linear
        :active="!computingState.finished"
        :value="computingState.progress"
        absolute
        bottom
      ></v-progress-linear>
    </v-app-bar>
    <v-main>
      <v-list>
        <v-list-item
          ripple
          v-for="(e, i) in searchResult"
          :key="i"
          @click="showIDDetail(e)"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{ e.key }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="e.value">
              {{ e.value }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-main>
    <v-snackbar v-model="snackbar.visible">
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn
          color="pink"
          text
          v-bind="attrs"
          @click="snackbar.visible = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>
    <v-dialog scrollable v-model="idDetailDialog.visible" max-width="400px">
      <v-card>
        <v-card-title>
          {{ idDetailDialog.key }}
        </v-card-title>
        <v-card-text>
          {{ idDetailDialog.value }}
        </v-card-text>
        <v-card-actions>
          <v-btn
            text
            color="primary"
            @click="copyTextAndCloseDetailDialog(idDetailDialog.key)"
          >
            复制ID
          </v-btn>
          <v-btn
            text
            color="primary"
            @click="copyTextAndCloseDetailDialog(idDetailDialog.value)"
          >
            复制描述
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="idDetailDialog.visible = false">
            关闭
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
function delayedValue(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}

function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

export default {
  name: "App",

  data: () => ({
    loading: true,
    snackbar: {
      visible: false,
      text: "",
    },
    idDetailDialog: {
      visible: false,
      key: "",
      value: "",
    },
    enumNames: [["loading", "正在加载"]],
    enums: {},
    version: "",
    publishTime: "",
    selectedEnumIndex: 0,
    selectingEnum: false,
    searchBoxFocus: false,
    searchText: null,
    computingState: {
      finished: true,
      progress: 0,
      restartCompute: false,
    },
    searchResult: [],
  }),

  computed: {
    enumNamesForList() {
      return this.enumNames.map((e) => e[1]);
    },
    selectedEnumMeta() {
      let meta = this.enumNames[this.selectedEnumIndex];
      return {
        id: meta[0],
        title: meta[1],
      };
    },
    selectedEnum() {
      return this.enums[this.selectedEnumMeta.id];
    },
  },

  methods: {
    showSnackBar(text) {
      this.snackbar.visible = true;
      this.snackbar.text = text;
    },
    showIDDetail(kv) {
      this.idDetailDialog.visible = true;
      this.idDetailDialog.key = kv.key;
      this.idDetailDialog.value = kv.value;
    },
    copyTextAndCloseDetailDialog(text) {
      this.idDetailDialog.visible = false;
      if (text) {
        this.copyText(text);
      }
    },
    copyText(text) {
      navigator.clipboard
        .writeText(text)
        .then(() => this.showSnackBar(`复制”${text}“成功`))
        .catch(() =>
          this.showSnackBar(`复制失败，请尝试在其他浏览器打开并复制`)
        );
    },
    focusSearchBox() {
      document.querySelector("#search_box").focus();
    },
    computeSearchResult() {
      if (!this.computingState.finished) {
        this.computingState.restartCompute = true;
      } else {
        this.computeSearchResultAsync()
          .then(() => delayedValue(100))
          .then(() => {
            if (this.computingState.restartCompute) {
              this.computingState.restartCompute = false;
              this.computeSearchResult();
            }
          });
      }
    },
    async computeSearchResultAsync() {
      const itemPerFrame = 1,
        elementPerFrame = 50;
      let { selectedEnum, searchText } = this;
      let i, chunk, keys;
      if (!selectedEnum) return;
      if (!searchText) searchText = "";
      this.computingState.finished = false;
      this.computingState.progress = 0;
      keys = Object.keys(selectedEnum);
      this.searchResult.length = 0;
      for (i = 0; i < keys.length; i += itemPerFrame) {
        chunk = keys.slice(i, i + itemPerFrame);
        if (searchText) {
          chunk = chunk.filter((key) => {
            return (
              key.includes(searchText) || selectedEnum[key].includes(searchText)
            );
          });
        }
        chunk = chunk.map((key) => {
          return { key, value: selectedEnum[key] };
        });
        this.computingState.progress = (i / keys.length) * 100;
        while (chunk.length > 0) {
          this.searchResult.push(...chunk.splice(0, elementPerFrame));
          if (this.searchBoxFocus) {
            await nextAnimationFrame();
          }
        }
        if (this.computingState.restartCompute) {
          break;
        }
      }
      this.computingState.finished = true;
      this.computingState.progress = 0;
    },
  },

  created: function () {
    document.title = "MCBEID表";
    fetch("./data.json")
      .then((res) => res.json())
      .then((json) => {
        this.loading = false;
        this.version = json.version;
        this.enums = json.enums;
        this.enumNames = json.names;
        this.publishTime = new Date(json.publishTime).toLocaleDateString();
        this.computeSearchResult();
      })
      .catch((err) => {
        this.showSnackBar(String(err));
      });
  },
};
</script>

<style>
</style>