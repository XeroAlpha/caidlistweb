<template>
  <v-app>
    <v-app-bar app outlined flat>
      <v-text-field
        id="search-box"
        outlined
        flat
        dense
        single-line
        clearable
        hide-details="auto"
        prepend-icon="mdi-magnify"
        v-model="searchText"
        :label="$t('searchBox.label')"
        :placeholder="searchBoxPlaceholder"
        class="search-box"
        @focus="searchBoxFocus = true"
        @blur="searchBoxFocus = false"
      ></v-text-field>
      <v-menu>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            outlined
            dense
            :loading="!engine.ready"
            height="40px"
            class="main-menu-activator ml-3 pr-2"
            v-bind="attrs"
            v-on="on"
          >
            {{ $t(activeEnumInfo.name) }}
            <v-icon class="ml-2">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list class="main-menu overflow-y-auto" max-height="90vh">
          <v-list-item-group
            v-model="enumId"
            mandatory
            color="primary"
            class="enum-select"
          >
            <tooltip-menu-list-item
              left
              v-for="(enumInfo, i) in engine.enumList"
              :key="i"
              :tooltip="$t(enumInfo.description)"
              :value="enumInfo.id"
              @click="focusSearchBox()"
            >
              <v-list-item-title>{{ $t(enumInfo.name) }}</v-list-item-title>
            </tooltip-menu-list-item>
          </v-list-item-group>
          <v-divider></v-divider>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.versionTooltip')"
            class="version-menu-activator"
            @click="openBranchMenuAndOpenGroup('version')"
          >
            <v-list-item-title>
              {{ $t("mainMenu.version", [engine.dataVersion]) }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.branchTooltip')"
            class="branch-menu-activator"
            @click="openBranchMenuAndOpenGroup('branch')"
          >
            <v-list-item-title>
              {{ $t("mainMenu.branch", [engine.branchName]) }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.optimizedListTooltip')"
            class="use-optimized-list"
            @click="useOptimizedList = !useOptimizedList"
          >
            <v-list-item-title>
              {{
                $t("mainMenu.optimizedList", [
                  $t(useOptimizedList ? "mainMenu.on" : "mainMenu.off"),
                ])
              }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.darkModeTooltip')"
            class="dark-mode"
            @click="darkMode = !darkMode"
          >
            <v-list-item-title>
              {{
                $t("mainMenu.darkMode", [
                  $t(darkMode ? "mainMenu.on" : "mainMenu.off"),
                ])
              }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.installPWATooltip')"
            class="install-pwa"
            v-if="$pwa.installReady"
            @click="$pwa.promptInstall()"
          >
            <v-list-item-title>
              {{ $t("mainMenu.installPWA") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.applyUpdateTooltip')"
            class="apply-update"
            v-if="$pwa.updateReady"
            @click="$pwa.forceUpdate()"
          >
            <v-list-item-title>
              {{ $t("mainMenu.applyUpdate") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.checkUpdateTooltip')"
            class="check-update"
            v-else-if="$pwa.ready"
            @click="checkUpdate()"
          >
            <v-list-item-title>
              {{ $t("mainMenu.checkUpdate") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.offlinePackTooltip')"
            class="offline-pack"
            :href="engine.offlineUrl"
            target="_blank"
          >
            <v-list-item-title>
              {{ $t("mainMenu.offlinePack") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <v-divider></v-divider>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.dataSourceTooltip')"
            class="data-source"
            :href="$t('mainMenu.dataSourceLink')"
            target="_blank"
          >
            <v-list-item-title>
              {{ $t("mainMenu.dataSource") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.feedbackTooltip')"
            class="feedback-page"
            :href="$t('mainMenu.feedbackLink')"
            target="_blank"
          >
            <v-list-item-title>
              {{ $t("mainMenu.feedback") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.aboutTooltip')"
            class="about-page"
            :href="$t('mainMenu.aboutLink')"
            target="_blank"
          >
            <v-list-item-title>
              {{ $t("mainMenu.about") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
        </v-list>
      </v-menu>
      <v-dialog v-model="branchMenu.visible" max-width="500px">
        <v-list class="branch-menu overflow-y-auto" max-height="90vh">
          <v-list-group class="version-group" v-model="branchMenu.versionGroup">
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title>
                  {{
                    $t("branchMenu.currentVersion", [
                      $t("branchMenu.versionTemplate", [
                        activeVersionInfo.name,
                        activeVersionInfo.dataVersion,
                      ]),
                    ])
                  }}
                </v-list-item-title>
              </v-list-item-content>
            </template>
            <v-list-item
              v-for="(versionInfo, i) in searchIndexes"
              :key="i"
              @click="versionType = versionInfo.id"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{
                    $t("branchMenu.versionTemplate", [
                      versionInfo.name,
                      versionInfo.dataVersion,
                    ])
                  }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ versionInfo.description }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-icon v-if="activeVersionInfo == versionInfo">mdi-check</v-icon>
            </v-list-item>
          </v-list-group>
          <v-divider></v-divider>
          <v-list-group class="branch-group" v-model="branchMenu.branchGroup">
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t("branchMenu.currentBranch", [activeBranchInfo.name]) }}
                </v-list-item-title>
              </v-list-item-content>
            </template>
            <v-list-item
              v-for="(branchInfo, i) in availableBranches"
              :key="i"
              @click="branchId = branchInfo.id"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ branchInfo.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ branchInfo.description }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-icon v-if="activeBranchInfo == branchInfo">mdi-check</v-icon>
            </v-list-item>
          </v-list-group>
          <v-divider></v-divider>
          <v-list-item
            class="close-branch-menu"
            link
            @click="branchMenu.visible = false"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ $t("branchMenu.close") }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-dialog>
      <v-progress-linear
        :active="!session.idle"
        :value="session.progress"
        :aria-label="$t('loadProgressBar')"
        absolute
        bottom
      ></v-progress-linear>
    </v-app-bar>
    <v-main>
      <v-list v-show="!searchText && session.globalSearch" class="welcome-list">
        <v-list-item>
          <v-list-item-content>
            <button-alert
              button
              :button-text="$t('welcomeList.guide')"
              @click="howToUse()"
            >
              {{ $t("welcomeList.text") }}
            </button-alert>
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          v-for="(enumInfo, i) in engine.enumList"
          :key="i"
          @click="(enumId = enumInfo.id), focusSearchBox()"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{ $t(enumInfo.name) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ $t(enumInfo.description) }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <div v-show="session.showNotFound && searchText">
        <button-alert
          :button="!!session.correction"
          :button-text="$t('searchCorrection.action')"
          @click="searchText = session.correction"
          class="search-correction ma-3"
        >
          {{ searchResultEmptyPrompt }}
        </button-alert>
      </div>
      <optimizable-list
        :items="session.results"
        :height="windowHeight - 65"
        :optimized="useOptimizedList"
        item-height="62px"
        class="search-result"
        v-show="!session.showNotFound"
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
      :entry="idDetailDialog.entry"
      @jump="jumpToResultEntry()"
    ></id-copy-dialog>
  </v-app>
</template>

<script>
import SearchEngine from "./core/SearchEngine.js";
import OptimizableList from "./components/OptimizableList.vue";
import ButtonAlert from "./components/ButtonInfoAlert.vue";
import IdCopyDialog from "./components/IDCopyDialog.vue";
import TooltipMenuListItem from "./components/TooltipMenuListItem.vue";

export default {
  name: "App",

  components: {
    OptimizableList,
    ButtonAlert,
    IdCopyDialog,
    TooltipMenuListItem,
  },

  data: () => ({
    snackbar: {
      visible: false,
      text: "",
      timeout: -1,
    },
    branchMenu: {
      visible: false,
      versionGroup: false,
      branchGroup: true,
      lastVersionType: "",
      lastBranchId: "",
    },
    idDetailDialog: {
      visible: false,
      entry: {
        enumId: "",
        key: "",
        value: "",
      },
    },
    windowHeight: 0,
    darkMode: false,
    lastDataVersion: {},
    versionType: "",
    branchId: "",
    enumId: SearchEngine.globalSearchEnumId,
    useOptimizedList: true,
    searchBoxFocus: false,
    searchText: "",
  }),

  computed: {
    activeVersionInfo() {
      return (
        this.searchIndexes.find((e) => e.id == this.versionType) ||
        this.searchIndexes[0]
      );
    },
    availableBranches() {
      return this.activeVersionInfo.branchList;
    },
    activeBranchInfo() {
      return (
        this.availableBranches.find((e) => e.id == this.branchId) ||
        this.availableBranches[0]
      );
    },
    activeEnumInfo() {
      return SearchEngine.getEnumInfo(this.enumId);
    },
    searchBoxPlaceholder() {
      if (this.session.globalSearch) {
        return this.$t("searchBox.placeholderGlobal");
      } else {
        return this.$t("searchBox.placeholder", [
          this.$tc("searchBox.placeholderEntryCount", this.session.enumSize),
        ]);
      }
    },
    searchResultEmptyPrompt() {
      if (this.session.correction) {
        return this.$t("searchCorrection.text", [
          this.searchText,
          this.session.correction,
        ]);
      } else {
        return this.$t("searchCorrection.noCorrection", [this.searchText]);
      }
    },
    title() {
      if (this.engine.ready) {
        return this.$t("document.titleWithBranch", [
          this.engine.versionName,
          this.engine.branchName,
        ]);
      } else {
        return this.$t("document.title");
      }
    },
  },

  watch: {
    "branchMenu.visible": function (newValue, oldValue) {
      if (newValue && !oldValue) {
        this.branchMenu.lastVersionType = this.versionType;
        this.branchMenu.lastBranchId = this.branchId;
      } else if (!newValue && oldValue) {
        if (
          this.branchMenu.lastVersionType != this.versionType ||
          this.branchMenu.lastBranchId != this.branchId
        ) {
          this.loadCurrentBranch("switchBranch");
        }
      }
    },
    searchText: "updateSearchSession",
    enumId: "updateSearchSession",
    darkMode: {
      handler(newValue) {
        this.$vuetify.theme.dark = newValue;
      },
      immediate: true,
    },
    title(newValue) {
      document.title = newValue;
    },
  },

  methods: {
    async checkUpdate() {
      try {
        this.$toastT("checkUpdate.checking");
        if (await this.$pwa.checkUpdate()) {
          this.$toastT("checkUpdate.installing");
        } else {
          this.$toastT("checkUpdate.upToDate");
        }
      } catch (err) {
        console.warn(err);
        this.$toastT("checkUpdate.failed", [err]);
      }
    },
    onWindowSizeChanged() {
      this.windowHeight = window.innerHeight;
    },
    async loadCurrentBranch(scene) {
      try {
        await SearchEngine.loadBranch(this.versionType, this.branchId);
        this.enumId = SearchEngine.getEnumInfo(this.enumId).id;
        this.updateSearchSession();
        if (scene == "switchBranch") {
          this.$toastT("branch.switchTo", [
            this.engine.versionName,
            this.engine.branchName,
          ]);
        }
      } catch (err) {
        console.warn(err);
        this.$toastT("branch.loadFailed", [err]);
      }
    },
    notifyGameVersionUpdate() {
      const updatedVersions = [];
      this.searchIndexes.forEach((versionInfo) => {
        const lastDataVersion = this.lastDataVersion[versionInfo.id];
        const dataVersion = versionInfo.dataVersion;
        if (lastDataVersion != dataVersion) {
          if (lastDataVersion) {
            updatedVersions.push([
              versionInfo.name,
              lastDataVersion,
              dataVersion,
            ]);
          }
          this.$set(this.lastDataVersion, versionInfo.id, dataVersion);
        }
      });
      if (updatedVersions.length) {
        this.$toastT("dataUpdate.gameVersion", [
          updatedVersions
            .map((e) => this.$t("toast.dataUpdate.gameVersionEntry", e))
            .join(this.$t("toast.dataUpdate.gameVersionEntryJoiner")),
        ]);
      }
    },
    updateSearchSession() {
      SearchEngine.updateSession(this.session, {
        enumId: this.enumId,
        text: this.searchText || "",
      });
    },
    openBranchMenuAndOpenGroup(group) {
      this.branchMenu.visible = true;
      if (group == "version") {
        this.branchMenu.versionGroup = true;
        this.branchMenu.branchGroup = false;
      } else {
        this.branchMenu.versionGroup = false;
        this.branchMenu.branchGroup = true;
      }
    },
    showIDDetail(entry) {
      this.idDetailDialog.visible = true;
      this.idDetailDialog.entry = { ...entry };
    },
    jumpToResultEntry() {
      const entry = this.idDetailDialog.entry;
      this.searchText = entry.key;
      this.enumId = entry.enumId;
    },
    focusSearchBox() {
      document.querySelector("#search-box").focus();
    },
    howToUse() {
      window.open(this.$t("welcomeList.guideLink"), "_blank");
    },
  },

  beforeCreate: function () {
    this.SearchEngine = SearchEngine;
    this.engine = SearchEngine.state;
    this.searchIndexes = SearchEngine.indexes;
    this.session = SearchEngine.newSearchSession();
  },
  mounted: function () {
    this.$useLocalStorage(
      "caidlist",
      [
        "lastDataVersion",
        "useOptimizedList",
        "darkMode",
        "versionType",
        "branchId",
        "enumId",
        "searchText",
      ],
      "20220114",
      (current, _, storage) => {
        if (!current && storage.lastDataVersion) {
          storage.versionType = "beta";
          storage.branchId = this.availableBranches[storage.branchIndex]?.id;
          storage.enumId = SearchEngine.globalSearchEnumId;
          storage.lastDataVersion = { beta: storage.lastDataVersion };
          delete storage.branchIndex;
          delete storage.selectedEnumIndex;
          return "20220114";
        }
      }
    );
    this.loadCurrentBranch("start");
    this.notifyGameVersionUpdate();
  },
};
</script>

<style>
html {
  overflow-y: auto !important;
}
.branch-menu .v-list-item__subtitle {
  white-space: normal;
}
</style>