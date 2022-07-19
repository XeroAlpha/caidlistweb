<template>
  <v-app>
    <v-app-bar
      app
      outlined
      flat
    >
      <v-text-field
        id="search-box"
        v-model="searchText"
        outlined
        flat
        dense
        clearable
        single-line
        autocomplete="off"
        hide-details="auto"
        prepend-icon="mdi-magnify"
        :label="$t('searchBox.label')"
        :placeholder="searchBoxPlaceholder"
        class="search-box"
        @focus="searchBoxFocus = true"
        @blur="searchBoxFocus = false"
        @keydown="onSearchBoxKeyDown($event)"
      />
      <v-menu right>
        <template #activator="{ on, attrs }">
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
            <v-icon class="ml-2">
              mdi-chevron-down
            </v-icon>
          </v-btn>
        </template>
        <v-list
          class="main-menu overflow-y-auto"
          max-height="90vh"
        >
          <v-list-item-group
            mandatory
            color="primary"
            class="enum-select"
            :value="enumId"
            @change="updateState({ enumId: $event })"
          >
            <tooltip-menu-list-item
              v-for="(enumInfo, i) in engine.enumList"
              :key="i"
              left
              :tooltip="$t(enumInfo.description)"
              :value="enumInfo.id"
              @click="focusSearchBox()"
            >
              <v-list-item-title>{{ $t(enumInfo.name) }}</v-list-item-title>
            </tooltip-menu-list-item>
          </v-list-item-group>
          <v-divider />
          <tooltip-menu-list-item
            left
            :tooltip="$t('mainMenu.versionTooltip')"
            class="version-menu-activator"
            @click="openBranchMenuAndOpenGroup('version')"
          >
            <v-list-item-title>
              {{ $t("mainMenu.version", [engine.coreVersion]) }}
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
          <v-divider />
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
            :tooltip="$t('mainMenu.columnWidthTooltip')"
            class="column-config"
            @click="columnConfigDialog.visible = true"
          >
            <v-list-item-title>
              {{ $t("mainMenu.columnWidth") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            v-if="editorMode"
            left
            :tooltip="$t('mainMenu.exportModifierTooltip')"
            class="export-modifier"
            @click="exportModifiers()"
          >
            <v-list-item-title>
              {{ $t("mainMenu.exportModifier") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            v-if="editorMode"
            left
            :tooltip="$t('mainMenu.importModifierTooltip')"
            class="import-modifier"
            @click="importModifiers()"
          >
            <v-list-item-title>
              {{ $t("mainMenu.importModifier") }}
            </v-list-item-title>
          </tooltip-menu-list-item>
          <tooltip-menu-list-item
            v-if="$pwa.installReady"
            left
            :tooltip="$t('mainMenu.installPWATooltip')"
            class="install-pwa"
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
          <v-divider />
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
      />
    </v-app-bar>
    <v-main>
      <v-list
        v-show="!searchText && session.globalSearch"
        class="welcome-list"
      >
        <v-list-item>
          <v-list-item-content>
            <button-alert
              button
              :button-text="$t('welcomeList.guide')"
              @click="howToUse()"
            >
              {{ $t("tips." + tipIndex) }}
            </button-alert>
          </v-list-item-content>
        </v-list-item>
        <optimizable-list
          :items="engine.enumList"
          :cols="columnCount"
        >
          <template #default="{ item }">
            <v-list-item
              @click="updateState({ enumId: item.id }), focusSearchBox()"
            >
              <v-list-item-content>
                <v-list-item-title>
                  {{ $t(item.name) }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ $t(item.description) }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
        </optimizable-list>
      </v-list>
      <div v-show="session.showNotFound && searchText">
        <v-alert
          v-show="session.error"
          outlined
          text
          type="error"
          class="search-error mb-0 ma-3"
        >
          {{ session.error }}
        </v-alert>
        <button-alert
          v-show="!session.error && session.correction"
          button
          :button-text="$t('searchCorrection.correct')"
          class="search-correction ma-3"
          @click="searchText = session.correction"
        >
          {{ $t("searchCorrection.text", [searchText, session.correction]) }}
        </button-alert>
        <button-alert
          v-show="!session.error && !session.correction"
          :button="!session.globalSearch"
          :button-text="$t('searchCorrection.globalSearch')"
          class="search-correction ma-3"
          @click="updateState({ enumId: SearchEngine.globalSearchEnumId })"
        >
          {{ $t("searchCorrection.noCorrection", [searchText]) }}
        </button-alert>
      </div>
      <optimizable-list
        v-show="!session.showNotFound"
        v-resize="onWindowSizeChanged"
        :items="session.results"
        :height="windowHeight - 65"
        :optimized="useOptimizedList"
        item-height="62px"
        :cols="columnCount"
        class="search-result"
      >
        <template #default="{ item }">
          <v-list-item
            :key="item.key"
            ripple
            @click="onEntryClick(item)"
          >
            <v-list-item-content>
              <v-list-item-title>
                <highlight-text-label
                  :value="item.keyHighlight || item.key"
                  :translate="item.keyTranslate"
                />
              </v-list-item-title>
              <v-list-item-subtitle v-if="item.value">
                <highlight-text-label
                  :value="item.valueHighlight || item.value"
                  :translate="item.valueTranslate"
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
    />
    <column-config-dialog
      v-model="columnConfigDialog.visible"
      :col-width="columnWidth"
      :window-width="windowWidth"
      @update="columnWidth = $event"
    />
  </v-app>
</template>

<script>
import SearchEngine from "@/core/SearchEngine.js";
import HistoryState from "@/core/HistoryState.js";
import OptimizableList from "@/components/OptimizableList.vue";
import ButtonAlert from "@/components/ButtonInfoAlert.vue";
import IdCopyDialog from "@/components/IDCopyDialog.vue";
import TooltipMenuListItem from "@/components/TooltipMenuListItem.vue";
import BranchMenu from "@/components/BranchMenu.vue";
import HighlightTextLabel from "@/components/HighlightTextLabel.js";
import ColumnConfigDialog from "@/components/ColumnConfigDialog.vue";

export default {
  name: "App",

  components: {
    OptimizableList,
    ButtonAlert,
    IdCopyDialog,
    TooltipMenuListItem,
    BranchMenu,
    HighlightTextLabel,
    ColumnConfigDialog,
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
    columnConfigDialog: {
      visible: false,
    },
    windowHeight: 0,
    windowWidth: 0,
    columnWidth: 0,
    darkMode: false,
    editorMode: false,
    lastDataVersion: {},
    versionType: "",
    branchId: "",
    enumId: SearchEngine.globalSearchEnumId,
    useOptimizedList: true,
    searchBoxFocus: false,
    searchText: "",
    tipIndex: -1,
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
    columnCount() {
      if (this.columnWidth > 0) {
        return Math.floor(this.windowWidth / this.columnWidth);
      } else {
        return 1;
      }
    },
    title() {
      const pwaSuffix = this.$pwa.displayInBrowser ? "" : "PWA";
      if (this.engine.ready) {
        return this.$t("document.titleWithBranch" + pwaSuffix, [
          this.engine.versionName,
          this.engine.branchName,
        ]);
      } else {
        return this.$t("document.title" + pwaSuffix);
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
        "columnWidth",
        "useOptimizedList",
        "darkMode",
        "editorMode",
        "versionType",
        "branchId",
        "enumId",
        "searchText",
        "tipIndex",
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
    window.addEventListener("keydown", (ev) => {
      if (ev.ctrlKey) {
        if (ev.key == "a" || ev.key == "v") {
          this.focusSearchBox();
          return;
        }
        if (ev.key == "f" || ev.key == "g") {
          this.focusSearchBox();
          ev.preventDefault();
          return;
        }
      }
    });
    this.tipIndex = (this.tipIndex + 1) % this.$t("tips").length;
  },

  methods: {
    onWindowSizeChanged() {
      this.windowHeight = window.innerHeight;
      this.windowWidth = window.innerWidth;
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
    onEntryClick(entry) {
      if (entry.action == "search") {
        this.updateState({ searchText: entry.text });
      } else if (entry.action == "switchBranch") {
        this.updateState(
          {
            searchText: "",
            versionType: entry.versionType,
            branchId: entry.branchId,
          },
          "switchBranch"
        );
      } else if (entry.action == "updateState") {
        this.updateState({
          searchText: "",
          ...entry.state,
        });
      } else if (entry.action == "custom") {
        const newState = entry.runAction(this);
        if (newState) {
          this.updateState(newState);
        }
      } else if (entry.action == "none") {
        return;
      } else {
        this.idDetailDialog.entry = entry;
        this.idDetailDialog.visible = true;
      }
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
    importModifiers() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.click();
      input.addEventListener("change", async () => {
        try {
          const file = input.files[0];
          const buffer = new Uint8Array(await file.arrayBuffer());
          const count = await SearchEngine.importModifiers(buffer);
          this.$toast(this.$t("importModifiers.success", [count]));
        } catch (err) {
          this.$toast(this.$t("importModifiers.failed", [err.message]));
        }
      });
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
    onSearchBoxKeyDown(event) {
      if (event.key == "Enter" || event.key == "Tab") {
        const firstResultEntry = this.session.results[0];
        if (this.searchText != "" && firstResultEntry) {
          if (event.key == "Tab" && firstResultEntry.action != "search") {
            return;
          }
          this.onEntryClick(firstResultEntry);
        }
      }
    },
    howToUse() {
      window.open(this.$t("welcomeList.guideLink"), "_blank");
    },
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