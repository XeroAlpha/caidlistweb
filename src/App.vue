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
        :placeholder="searchBoxPlaceholder"
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
            {{ selectedEnumMeta.name }}
            <v-icon class="ml-2">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list class="overflow-y-auto" max-height="90vh">
          <v-list-item-group
            v-model="selectedEnumIndex"
            mandatory
            color="primary"
          >
            <v-list-item
              v-for="(enumMeta, i) in enumMetaList"
              :key="i"
              @click="focusSearchBox()"
            >
              <v-list-item-title>{{ enumMeta.name }}</v-list-item-title>
            </v-list-item>
          </v-list-item-group>
          <v-divider></v-divider>
          <v-list-item link @click="branchMenu.visible = true">
            <v-list-item-title>分支：{{ branchName }}</v-list-item-title>
          </v-list-item>
          <v-list-item link>
            <v-list-item-title>版本：{{ packageVersion }}</v-list-item-title>
          </v-list-item>
          <v-list-item link @click="useOptimizedList = !useOptimizedList">
            <v-list-item-title>
              性能优化：{{ useOptimizedList ? "开启" : "关闭" }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="darkMode = !darkMode">
            <v-list-item-title>
              深色模式：{{ darkMode ? "开启" : "关闭" }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item link v-if="$pwa.installReady" @click="$pwa.promptInstall()">
            <v-list-item-title>安装离线版</v-list-item-title>
          </v-list-item>
          <v-list-item link v-if="$pwa.updateReady" @click="$pwa.forceUpdate()">
            <v-list-item-title>应用更新</v-list-item-title>
          </v-list-item>
          <v-list-item link v-else-if="$pwa.ready" @click="checkUpdate()">
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
      <v-dialog v-model="branchMenu.visible" max-width="500px">
        <v-list class="overflow-y-auto" max-height="90vh">
          <v-list-item
            v-for="(branchMeta, i) in branchMenu.list"
            :key="i"
            @click="closeBranchMenuAndLoadBranch(i)"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ branchMeta.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ branchMeta.description }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-icon v-if="branchIndex == i">mdi-check</v-icon>
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
      <v-list v-show="!searchText && isGlobalSearching">
        <v-list-item>
          <v-list-item-content>
            <button-alert button button-text="使用方法" @click="howToUse()">
              欢迎使用MCBEID表！
            </button-alert>
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          v-for="(enumMeta, i) in enumMetaList"
          :key="i"
          @click="(selectedEnumIndex = i), focusSearchBox()"
        >
          <v-list-item-content>
            <v-list-item-title>{{ enumMeta.name }}</v-list-item-title>
            <v-list-item-subtitle>{{
              enumMeta.description
            }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <div v-show="searchResultEmpty && searchText">
        <button-alert
          :button="searchCorrection"
          button-text="更正"
          @click="searchText = searchCorrection"
          class="ma-3"
        >
          {{ searchResultEmptyPrompt }}
        </button-alert>
      </div>
      <optimizable-list
        :items="searchResult"
        :height="windowHeight - 65"
        :optimized="useOptimizedList"
        item-height="62px"
        v-show="!searchResultEmpty"
        v-resize="onWindowSizeChanged"
      >
        <template v-slot:default="{ item }">
          <v-list-item ripple :key="item.key" @click="showIDDetail(item)">
            <v-list-item-content>
              <v-list-item-title v-if="item.keyHighlight">
                <span>{{ item.keyPre }}</span>
                <span class="highlight--text">{{ item.keyHl }}</span>
                <span>{{ item.keyPost }}</span>
              </v-list-item-title>
              <v-list-item-title v-else>
                {{ item.key }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="item.valueHighlight">
                <span>{{ item.valuePre }}</span>
                <span class="highlight--text">{{ item.valueHl }}</span>
                <span>{{ item.valuePost }}</span>
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else-if="item.value">
                {{ item.value }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>
      </optimizable-list>
    </v-main>
    <id-copy-dialog
      v-model="idDetailDialog.visible"
      :idKey="idDetailDialog.key"
      :idValue="idDetailDialog.value"
    ></id-copy-dialog>
  </v-app>
</template>

<script>
import Corrections from "./assets/corrections.json";
import { dataVersion, branchList } from "./assets/dataInfo.json";
import OptimizableList from "./components/OptimizableList.vue";
import ButtonAlert from "./components/ButtonInfoAlert.vue";
import IdCopyDialog from "./components/IDCopyDialog.vue";

function delayedValue(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}

function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function mapLocalStorage(thisObj, namespace, storageKeys) {
  const prefix = namespace ? namespace + ":" : "";
  storageKeys.forEach((key) => {
    const defaultValue = thisObj[key];
    let reader, writer;
    if (typeof defaultValue == "number") {
      reader = (v) => Number(v);
      writer = (v) => String(v);
    } else if (typeof defaultValue == "boolean") {
      reader = (v) => v == "1";
      writer = (v) => (v ? "1" : "0");
    } else {
      reader = (v) => v;
      writer = (v) => (v ? v : "");
    }
    thisObj[key] = reader(localStorage.getItem(prefix + key) ?? defaultValue);
    thisObj.$watch(key, (newValue) => {
      localStorage.setItem(prefix + key, writer(newValue));
    });
  });
}

const GlobalEnumMeta = {
  id: "#global",
  name: "全局",
  description: "搜索全部条目",
};

// Performance Threshold
const itemPerFrame = 1,
  elementPerFrame = 50,
  updateCountPerFrame = 100,
  searchCountPerFrame = 300,
  globalSearchThreshold = 100;

export default {
  name: "App",

  components: { OptimizableList, ButtonAlert, IdCopyDialog },

  data: () => ({
    loading: true,
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
    darkMode: false,
    branchIndex: 0,
    enumNames: [],
    enums: {},
    lastDataVersion: "",
    versionType: "",
    branchName: "",
    packageVersion: "",
    offlineUrl: "",
    selectedEnumIndex: 0,
    useOptimizedList: true,
    searchBoxFocus: false,
    searchText: null,
    computingState: {
      finished: true,
      progress: 0,
      restartCompute: false,
      updateCount: 0,
      searchCount: 0,
    },
    searchEnumLength: 0,
    searchResult: [],
    searchResultEmpty: false,
    searchCorrection: null,
  }),

  computed: {
    enumMetaList() {
      return [
        GlobalEnumMeta,
        ...this.enumNames.map((e) => ({
          id: e[0],
          name: e[1],
          description: e[2],
        })),
      ];
    },
    selectedEnumMeta() {
      return this.enumMetaList[this.selectedEnumIndex] || GlobalEnumMeta;
    },
    isGlobalSearching() {
      return this.selectedEnumMeta.id == GlobalEnumMeta.id;
    },
    selectedEnum() {
      if (this.isGlobalSearching) {
        return null;
      } else {
        return this.enums[this.selectedEnumMeta.id];
      }
    },
    searchBoxPlaceholder() {
      if (this.isGlobalSearching) {
        return GlobalEnumMeta.description;
      } else {
        return "在 " + this.searchEnumLength + " 个条目中搜索";
      }
    },
    searchResultEmptyPrompt() {
      if (this.searchCorrection) {
        return (
          "未找到与“" +
          this.searchText +
          "”相关的条目，" +
          "您要找的是不是“" +
          this.searchCorrection +
          "”？"
        );
      } else {
        return "未找到与“" + this.searchText + "”相关的条目";
      }
    },
  },

  watch: {
    searchText: "computeSearchResult",
    selectedEnumIndex: "computeSearchResult",
    darkMode: {
      handler(newValue) {
        this.$vuetify.theme.dark = newValue;
      },
      immediate: true,
    },
  },

  methods: {
    async checkUpdate() {
      try {
        this.$toast("正在检测更新");
        if (await this.$pwa.checkUpdate()) {
          this.$toast("更新正在安装，稍后将自动应用");
        } else {
          this.$toast("已是最新版本");
        }
      } catch (err) {
        this.$toast("获取更新失败：" + err);
      }
    },
    onWindowSizeChanged() {
      this.windowHeight = window.innerHeight;
    },
    async loadCurrentBranch(restoringState) {
      const branchMeta = branchList[this.branchIndex] || branchList[0];
      this.offlineUrl = branchMeta.offlineUrl;
      this.loading = true;
      try {
        const json = await (await fetch(branchMeta.dataUrl)).json();
        this.versionType = json.versionType;
        this.branchName = json.branchName;
        this.packageVersion = json.packageVersion;
        this.enums = json.enums;
        if (!restoringState && this.enumNames.length != json.names.length) {
          this.selectedEnumIndex = 0;
        }
        this.enumNames = json.names;
        this.loading = false;
        this.computeSearchResult();
        return true;
      } catch (err) {
        this.$toast("获取数据失败：" + err);
      }
      return false;
    },
    closeBranchMenuAndLoadBranch(index) {
      this.branchMenu.visible = false;
      this.branchIndex = index;
      this.loadCurrentBranch().then((success) => {
        if (success) {
          this.$toast("切换至分支：" + this.branchName);
        }
      });
    },
    showIDDetail(kv) {
      this.idDetailDialog.visible = true;
      this.idDetailDialog.key = kv.key;
      this.idDetailDialog.value = kv.value;
    },
    focusSearchBox() {
      document.querySelector("#search_box").focus();
    },
    computeSearchResult() {
      if (this.loading) return;
      if (!this.computingState.finished) {
        this.computingState.restartCompute = true;
      } else {
        this.computeSearchCorrection();
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
    computeSearchInChunk(chunk, selectedEnum, searchTextLowerCase) {
      const searchLength = searchTextLowerCase.length;
      if (searchLength) {
        chunk = chunk
          .map((key) => {
            let value = selectedEnum[key];
            let indexInKey = key.toLowerCase().indexOf(searchTextLowerCase);
            let indexInValue = value.toLowerCase().indexOf(searchTextLowerCase);
            if (indexInKey >= 0 || indexInValue >= 0) {
              let result = { key, value };
              if (indexInKey >= 0) {
                result = {
                  ...result,
                  keyHighlight: true,
                  keyPre: key.slice(0, indexInKey),
                  keyHl: key.slice(indexInKey, indexInKey + searchLength),
                  keyPost: key.slice(indexInKey + searchLength),
                };
              }
              if (indexInValue >= 0) {
                result = {
                  ...result,
                  valueHighlight: true,
                  valuePre: value.slice(0, indexInValue),
                  valueHl: value.slice(
                    indexInValue,
                    indexInValue + searchLength
                  ),
                  valuePost: value.slice(indexInValue + searchLength),
                };
              }
              return result;
            } else {
              return null;
            }
          })
          .filter((item) => item != null);
      } else {
        chunk = chunk.map((key) => {
          return {
            key,
            value: selectedEnum[key],
          };
        });
      }
      return chunk;
    },
    async computeSearchResultForEnum(
      selectedEnum,
      searchTextLowerCase,
      progressOffset
    ) {
      let i, keys, chunk;
      keys = Object.keys(selectedEnum);
      this.searchEnumLength = keys.length;
      for (i = 0; i < keys.length; i += itemPerFrame) {
        chunk = keys.slice(i, i + itemPerFrame);
        this.computingState.searchCount += chunk.length;
        chunk = this.computeSearchInChunk(
          chunk,
          selectedEnum,
          searchTextLowerCase
        );
        this.computingState.progress =
          (i / keys.length) * progressOffset[1] + progressOffset[0];
        while (chunk.length > 0) {
          this.searchResult.push(...chunk.splice(0, elementPerFrame));
          this.computingState.updateCounts++;
          if (
            (this.searchBoxFocus && !this.useOptimizedList) ||
            this.computingState.updateCounts > updateCountPerFrame
          ) {
            this.computingState.updateCounts = 0;
            await nextAnimationFrame();
          }
        }
        if (this.computingState.searchCount > searchCountPerFrame) {
          this.computingState.searchCount = 0;
          await nextAnimationFrame();
        }
        if (this.computingState.restartCompute) {
          break;
        }
      }
    },
    async computeSearchResultAsync() {
      let { searchText } = this;
      if (!searchText) searchText = "";
      let searchTextLowerCase = searchText.toLowerCase();
      this.computingState.finished = false;
      this.computingState.progress = 0;
      this.computingState.updateCount = 0;
      this.computingState.searchCount = 0;
      this.searchResult.splice(0); // remove all elements
      if (this.isGlobalSearching) {
        if (searchText) {
          let { enumMetaList } = this;
          let i,
            progressPerEnum = 100 / enumMetaList.length;
          for (i = 1; i < enumMetaList.length; i++) {
            let selectedEnum = this.enums[enumMetaList[i].id];
            await this.computeSearchResultForEnum(
              selectedEnum,
              searchTextLowerCase,
              [progressPerEnum * i, progressPerEnum]
            );
            if (
              this.computingState.restartCompute ||
              this.searchResult.length > globalSearchThreshold
            ) {
              break;
            }
          }
        }
      } else {
        let { selectedEnum } = this;
        if (!selectedEnum) return;
        await this.computeSearchResultForEnum(
          selectedEnum,
          searchTextLowerCase,
          [0, 100]
        );
      }
      this.computingState.finished = true;
      this.computingState.progress = 0;
      this.searchResultEmpty = this.searchResult.length == 0;
    },
    computeSearchCorrection() {
      let { searchText } = this;
      let newSearchText = searchText;
      if (newSearchText) {
        Corrections.words.forEach((wordCorrection) => {
          newSearchText = newSearchText.replace(
            wordCorrection[0],
            wordCorrection[1]
          );
        });
        Corrections.patterns.forEach((wordCorrection) => {
          newSearchText = newSearchText.replace(
            new RegExp(wordCorrection[0], "g"),
            wordCorrection[1]
          );
        });
        if (newSearchText != searchText) {
          this.searchCorrection = newSearchText;
          return;
        }
      }
      this.searchCorrection = null;
    },
    howToUse() {
      this.$toast("ProjectXero：我正在写使用方法，请各位稍等几日。");
    },
  },

  mounted: function () {
    mapLocalStorage(this, "caidlist", [
      "lastDataVersion",
      "useOptimizedList",
      "darkMode",
      "branchIndex",
      "selectedEnumIndex",
      "searchText",
    ]);
    this.loadCurrentBranch(true);
    if (this.lastDataVersion != dataVersion) {
      if (this.lastDataVersion) {
        this.$toast(
          `游戏版本已更新：${this.lastDataVersion} -> ${dataVersion}`
        );
      }
      this.lastDataVersion = dataVersion;
    }
  },
};
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>