<template>
  <v-app>
    <v-app-bar app outlined flat>
      <v-text-field
        id="search-box"
        outlined
        flat
        dense
        clearable
        single-line
        hide-details="auto"
        prepend-icon="mdi-magnify"
        v-model="searchText"
        :label="$t('searchBox.label')"
        :placeholder="searchBoxPlaceholder"
        class="search-box"
        @focus="searchBoxFocus = true"
        @blur="searchBoxFocus = false"
      ></v-text-field>
      <v-menu right>
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
            <span
              class="text-truncate text-none"
              style="max-width: 25vw; display: inline-block"
            >
              {{ $t(activeEnumInfo.name) }}
            </span>
            <v-icon class="ml-2">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list class="main-menu overflow-y-auto" max-height="90vh">
          <v-list-item-group
            mandatory
            color="primary"
            class="enum-select"
            :value="enumId"
            @change="updateState({ enumId: $event })"
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
            :tooltip="$t('mainMenu.copySearchLinkTooltip')"
            class="copy-search-link"
            @click="copySearchLink()"
          >
            <v-list-item-title>
              {{ $t("mainMenu.copySearchLink") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <v-divider></v-divider>
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
            :tooltip="$t('mainMenu.editorModeTooltip')"
            class="editor-mode"
            @click="editorMode = !editorMode"
          >
            <v-list-item-title>
              {{
                $t("mainMenu.editorMode", [
                  $t(editorMode ? "mainMenu.on" : "mainMenu.off"),
                ])
              }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.exportModifierTooltip')"
            class="export-modifier"
            v-if="editorMode"
            @click="exportModifiers()"
          >
            <v-list-item-title>
              {{ $t("mainMenu.exportModifier") }}
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
      <branch-menu
        v-model="branchMenu.visible"
        :group="branchMenu.group"
        :version-type="versionType"
        :branch-id="branchId"
        @change="updateState($event, 'switchBranch')"
      />
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
          @click="updateState({ enumId: enumInfo.id }), focusSearchBox()"
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
              <v-list-item-title>
                <highlight-text-label :value="item.keyHighlight || item.key" />
              </v-list-item-title>
              <v-list-item-subtitle v-if="item.value">
                <highlight-text-label
                  :value="item.valueHighlight || item.value"
                />
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>
      </optimizable-list>
    </v-main>
    <id-copy-dialog
      v-model="idDetailDialog.visible"
      :editable="editorMode && !idDetailDialog.saving"
      :entry="idDetailDialog.entry"
      :state="{ versionType, branchId, enumId, searchText }"
      @update="updateState($event)"
    ></id-copy-dialog>
  </v-app>
</template>

<script>
import SearchEngine from "./core/SearchEngine.js";
import HistoryState from "./core/HistoryState.js";
import OptimizableList from "./components/OptimizableList.vue";
import ButtonAlert from "./components/ButtonInfoAlert.vue";
import IdCopyDialog from "./components/IDCopyDialog.vue";
import TooltipMenuListItem from "./components/TooltipMenuListItem.vue";
import BranchMenu from "./components/BranchMenu.vue";
import HighlightTextLabel from "./components/HighlightTextLabel.js";

export default {
  name: "App",

  components: {
    OptimizableList,
    ButtonAlert,
    IdCopyDialog,
    TooltipMenuListItem,
    BranchMenu,
    HighlightTextLabel,
  },

  data: () => ({
    branchMenu: {
      visible: false,
      group: "",
    },
    idDetailDialog: {
      visible: false,
      saving: false,
      entry: {
        enumId: "",
        key: "",
        value: "",
      },
    },
    windowHeight: 0,
    darkMode: false,
    editorMode: false,
    lastDataVersion: {},
    versionType: "",
    branchId: "",
    enumId: SearchEngine.globalSearchEnumId,
    useOptimizedList: true,
    searchBoxFocus: false,
    searchText: "",
  }),

  computed: {
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
    urlHash() {
      return [
        "#" + this.versionType + "-" + this.branchId,
        this.enumId,
        encodeURIComponent(this.searchText || ""),
      ].join("/");
    },
  },

  watch: {
    searchText: "updateSearchSession",
    searchBoxFocus: "checkHistoryStateChanged",
    enumId: ["updateSearchSession", "checkHistoryStateChanged"],
    darkMode: {
      handler(newValue) {
        this.$vuetify.theme.dark = newValue;
      },
      immediate: true,
    },
    title(newValue) {
      document.title = newValue;
    },
    "$pwa.updateFound": function (newValue) {
      if (newValue) {
        this.$toast(this.$t("resUpdate.updateFound"));
      }
    },
    "$pwa.updateReady": {
      handler(newValue) {
        if (newValue) {
          this.$toast(this.$t("resUpdate.updateReady"), {
            actions: [
              {
                text: this.$t("resUpdate.updateNow"),
                action: () => {
                  this.$pwa.forceUpdate();
                },
              },
            ],
          });
        }
      },
      immediate: true,
    },
  },

  methods: {
    onWindowSizeChanged() {
      this.windowHeight = window.innerHeight;
    },
    async loadCurrentBranch(scene) {
      try {
        await SearchEngine.loadBranch(this.versionType, this.branchId);
        this.updateState({ enumId: SearchEngine.getEnumInfo(this.enumId).id });
        this.updateSearchSession();
        if (scene == "switchBranch") {
          this.$toast(
            this.$t("branch.switchTo", [
              this.engine.versionName,
              this.engine.branchName,
            ])
          );
        }
      } catch (err) {
        console.warn(err);
        this.$toast(this.$t("branch.loadFailed", [err]));
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
        this.$toast(
          this.$t("resUpdate.gameVersion", [
            updatedVersions
              .map((e) => this.$t("resUpdate.gameVersionEntry", e))
              .join(this.$t("resUpdate.gameVersionEntryJoiner")),
          ])
        );
      }
    },
    updateSearchSession() {
      SearchEngine.updateSession(this.session, {
        enumId: this.enumId,
        text: this.searchText || "",
      });
    },
    openBranchMenuAndOpenGroup(group) {
      this.branchMenu.group = group;
      this.branchMenu.visible = true;
    },
    showIDDetail(entry) {
      this.idDetailDialog.entry = entry;
      this.idDetailDialog.visible = true;
    },
    async updateState(state, scene) {
      const oldState = {
        ...state,
        versionType: this.versionType,
        branchId: this.branchId,
        enumId: this.enumId,
        searchText: this.searchText,
      };
      const changedFields = Object.keys(state).filter(
        (k) => state[k] != oldState[k]
      );
      HistoryState.syncState();
      changedFields.forEach((k) => (this[k] = state[k]));
      if (state.entryValue != null) {
        this.idDetailDialog.saving = true;
        this.idDetailDialog.entry.value = state.entryValue;
        this.idDetailDialog.entry.valueHighlight = null;
        await SearchEngine.updateEnumEntry(
          this.enumId,
          this.idDetailDialog.entry.key,
          this.idDetailDialog.entry.value
        );
        this.idDetailDialog.saving = false;
      }
      if (
        changedFields.includes("versionType") ||
        changedFields.includes("branchId")
      ) {
        this.loadCurrentBranch(scene);
      }
      HistoryState.syncState();
    },
    checkHistoryStateChanged() {
      HistoryState.triggerSync();
    },
    async exportModifiers() {
      const buffer = await SearchEngine.exportModifiers();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob([buffer.buffer], { type: "application/json" })
      );
      a.download = this.$t("mainMenu.exportModifierFilename") + ".json";
      a.click();
      URL.revokeObjectURL(a.href);
    },
    applyStateFromHash() {
      const result = /#(\w+)-(\w+)\/(\S+)\/(.*)/.exec(location.hash);
      if (result) {
        const reqUrl = location.origin + location.pathname + location.search;
        history.replaceState(history.state, document.title, reqUrl);
        this.updateState({
          versionType: result[1],
          branchId: result[2],
          enumId: result[3],
          searchText: decodeURIComponent(result[4]),
        });
      }
    },
    copySearchLink() {
      const reqUrl = location.origin + location.pathname + location.search;
      this.$copyText(reqUrl + this.urlHash, "idCopyDialog.linkCopiedPrompt");
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
        "editorMode",
        "versionType",
        "branchId",
        "enumId",
        "searchText",
      ],
      "20220114",
      (current, _, storage) => {
        if (!current && storage.lastDataVersion) {
          storage.versionType = "beta";
          storage.branchId = SearchEngine.getBranchIdByIndex(
            "beta",
            storage.branchIndex
          );
          storage.enumId = SearchEngine.globalSearchEnumId;
          storage.lastDataVersion = { beta: storage.lastDataVersion };
          delete storage.branchIndex;
          delete storage.selectedEnumIndex;
          return "20220114";
        }
      }
    );
    HistoryState.bindReactiveObject(this, [
      "versionType",
      "branchId",
      "enumId",
      "searchText",
    ]);
    this.applyStateFromHash();
    HistoryState.registerListener();
    this.loadCurrentBranch("initial");
    this.notifyGameVersionUpdate();
    window.addEventListener("hashchange", () => {
      this.applyStateFromHash();
    });
  },
};
</script>

<style>
html {
  overflow-y: auto !important;
}
@media (max-width: 480px) {
  .search-box .v-input__prepend-outer {
    display: none;
  }
}
</style>