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
        label="搜索"
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
              @click="focusSearchBox()"
            >
              <v-list-item-title>{{ enumName }}</v-list-item-title>
            </v-list-item>
          </v-list-item-group>
          <v-divider></v-divider>
          <v-list-item link @click="branchMenu.visible = true">
            <v-list-item-title>分支：{{ branchName }}</v-list-item-title>
          </v-list-item>
          <v-list-item disabled>
            <v-list-item-title>版本：{{ version }}</v-list-item-title>
          </v-list-item>
          <v-list-item link @click="fullLoadMode = !fullLoadMode">
            <v-list-item-title>
              性能优化：{{ fullLoadMode ? "关闭" : "开启" }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item link v-if="pwa.installReady" @click="pwaPromptInstall()">
            <v-list-item-title>安装离线版</v-list-item-title>
          </v-list-item>
          <v-list-item link v-if="pwa.updateReady" @click="pwaForceUpdate()">
            <v-list-item-title>应用更新</v-list-item-title>
          </v-list-item>
          <v-list-item link v-else-if="pwa.ready" @click="pwaCheckUpdate()">
            <v-list-item-title>检测更新</v-list-item-title>
          </v-list-item>
          <v-list-item :href="offlineUrl">
            <v-list-item-title>下载压缩包</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item href="https://jq.qq.com/?_wv=1027&k=RcLgagPy">
            <v-list-item-title>问题反馈</v-list-item-title>
          </v-list-item>
          <v-list-item href="https://gitee.com/projectxero/idlistweb">
            <v-list-item-title>关于 MCBEID表</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-dialog v-model="branchMenu.visible" max-width="300px">
        <v-list class="overflow-y-auto" max-height="90vh">
          <v-list-item
            v-for="(branchMeta, i) in branchMenu.list"
            :key="i"
            @click="closeBranchMenuAndLoadBranch(branchMeta)"
          >
            <v-list-item-title>{{ branchMeta.name }}</v-list-item-title>
            <v-icon v-if="branchMeta.name == branchName">mdi-check</v-icon>
          </v-list-item>
        </v-list>
      </v-dialog>
      <v-progress-linear
        :active="!computingState.finished"
        :value="computingState.progress"
        aria-label="加载进度"
        absolute
        bottom
      ></v-progress-linear>
    </v-app-bar>
    <v-main>
      <v-alert
        text
        type="info"
        class="ma-3"
        v-show="!searchResult.length && searchText.length"
      >
        未找到与“{{searchText}}”相关的 ID
      </v-alert>
      <v-list v-show="searchResult.length" v-if="fullLoadMode">
        <v-list-item
          ripple
          v-for="(item, index) in searchResult"
          :key="index"
          @click="showIDDetail(item)"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{ item.key }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="item.value">
              {{ item.value }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-virtual-scroll
        :items="searchResult"
        :height="windowHeight - 65"
        item-height="62px"
        bench="1"
        v-show="searchResult.length"
        v-resize="onWindowSizeChanged"
        v-else
      >
        <template v-slot:default="{ item }">
          <v-list-item ripple :key="item.key" @click="showIDDetail(item)">
            <v-list-item-content>
              <v-list-item-title>
                {{ item.key }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="item.value">
                {{ item.value }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-virtual-scroll>
    </v-main>
    <v-snackbar v-model="snackbar.visible" :timeout="snackbar.timeout">
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
import PWA from "./pwa";

function delayedValue(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}

function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

const branchList = [
  {
    id: "vanilla",
    name: "原版",
    dataUrl: "./data.json",
    offlineUrl: "./latest.zip",
  },
  {
    id: "education",
    name: "教育版",
    dataUrl: "./data.education.json",
    offlineUrl: "./latest.education.zip",
  },
  {
    id: "experiment",
    name: "实验性玩法",
    dataUrl: "./data.experiment.json",
    offlineUrl: "./latest.experiment.zip",
  },
  {
    id: "translator",
    name: "翻译专用",
    dataUrl: "./data.translator.json",
    offlineUrl: "./latest.translator.zip",
  },
];
export default {
  name: "App",

  data: () => ({
    loading: true,
    pwa: {
      ready: false,
      installReady: false,
      updateReady: false,
    },
    snackbar: {
      visible: false,
      text: "",
      timeout: -1,
    },
    branchMenu: {
      visible: false,
      list: branchList,
    },
    idDetailDialog: {
      visible: false,
      key: "",
      value: "",
    },
    windowHeight: 0,
    enumNames: [["loading", "正在加载"]],
    enums: {},
    branchName: "",
    version: "",
    publishTime: "",
    offlineUrl: "",
    selectedEnumIndex: 0,
    fullLoadMode: false,
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
    pwaPromptInstall() {
      this.pwa.installReady = false;
      PWA.promptInstall();
    },
    pwaForceUpdate() {
      this.pwa.updateReady = false;
      PWA.forceUpdate();
    },
    async pwaCheckUpdate() {
      try {
        this.showSnackBar("正在检测更新");
        if (await PWA.checkUpdate()) {
          this.showSnackBar("更新正在安装，稍后将自动应用");
        } else {
          this.showSnackBar("已是最新版本");
        }
      } catch (err) {
        this.showSnackBar("获取更新失败：" + err);
      }
    },
    showSnackBar(text) {
      this.snackbar.visible = true;
      this.snackbar.text = text;
      this.snackbar.timeout = 5000;
    },
    onWindowSizeChanged() {
      this.windowHeight = window.innerHeight;
    },
    async loadBranch(branchMeta) {
      this.offlineUrl = branchMeta.offlineUrl;
      try {
        const json = await (await fetch(branchMeta.dataUrl)).json();
        this.loading = false;
        this.version = json.version;
        this.branchName = json.branchName;
        this.enums = json.enums;
        this.enumNames = json.names;
        this.publishTime = new Date(json.publishTime).toLocaleDateString();
        this.computeSearchResult();
        return true;
      } catch (err) {
        this.showSnackBar("获取数据失败：" + err);
      }
      return false;
    },
    closeBranchMenuAndLoadBranch(branchMeta) {
      this.branchMenu.visible = false;
      this.loadBranch(branchMeta).then((success) => {
        if (success) {
          this.showSnackBar("切换至分支：" + this.branchName);
        }
      });
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
    async copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.showSnackBar(`复制”${text}“成功`);
      } catch (err) {
        this.showSnackBar(`复制失败，请尝试在其他浏览器打开并复制`);
      }
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
        elementPerFrame = 50,
        updateCountPerFrame = 100;
      let { selectedEnum, searchText } = this;
      let i,
        chunk,
        keys,
        updateCounts = 0;
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
          updateCounts++;
          if (
            (this.searchBoxFocus && this.fullLoadMode) ||
            updateCounts > updateCountPerFrame
          ) {
            updateCounts = 0;
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
    PWA.on("ready", () => (this.pwa.ready = true))
      .on("updateReady", () => (this.pwa.updateReady = true))
      .on("installReady", () => (this.pwa.installReady = true));
    this.pwa.ready = PWA.workerState == "ready";
    this.pwa.installReady = PWA.installPrompt != null;
    this.pwa.updateReady = PWA.updatedWorker != null;
    this.loadBranch(branchList[0]);
  },
};
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>