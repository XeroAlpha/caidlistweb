<template>
  <v-dialog
    scrollable
    :value="visible"
    :persistent="editMode"
    max-width="400px"
    @input="$emit('visibility-changed', $event)"
    @keydown="onKeyDown"
  >
    <v-card class="id-copy-dialog">
      <v-card-title>
        {{ $t("idCopyDialog.title") }}
      </v-card-title>
      <v-simple-table
        class="id-dialog-table"
        :class="{ 'hide-actions': editMode }"
      >
        <template #default>
          <tbody>
            <tr v-if="entry.enumId">
              <td>{{ $t("idCopyDialog.entryEnum") }}</td>
              <td>
                <copyable-text-label :text="enumName" />
              </td>
              <td>
                <tooltip-icon-button
                  v-if="isGlobalSearch"
                  left
                  plain
                  small
                  color="primary"
                  class="jump-to-enum"
                  icon="mdi-crosshairs"
                  :label="$t('idCopyDialog.jumpTo')"
                  @click="handleEvent('jumpTo')"
                />
                <tooltip-icon-button
                  v-else
                  left
                  plain
                  small
                  color="primary"
                  class="jump-to-global"
                  icon="mdi-database-search-outline"
                  :label="$t('idCopyDialog.searchGlobal')"
                  @click="handleEvent('searchGlobal')"
                />
              </td>
            </tr>
            <tr>
              <td>{{ $t("idCopyDialog.entryId") }}</td>
              <td>
                <v-text-field
                  v-if="editMode"
                  v-model="memory.key"
                  dense
                  hide-details
                  disabled
                  class="text-body-2 mt-0 mb-1"
                />
                <copyable-text-label
                  v-else
                  :text="entry.key"
                />
              </td>
              <td>
                <tooltip-icon-button
                  left
                  plain
                  small
                  color="primary"
                  icon="mdi-magnify"
                  :disabled="isSearchingKey"
                  :label="$t('idCopyDialog.searchId')"
                  @click="handleEvent('searchId')"
                />
              </td>
            </tr>
            <tr v-if="entry.value || editMode">
              <td>{{ $t("idCopyDialog.entryValue") }}</td>
              <td>
                <v-text-field
                  v-if="editMode"
                  v-model="memory.value"
                  dense
                  hide-details
                  class="text-body-2 mt-0 mb-1"
                />
                <copyable-text-label
                  v-else
                  :text="entry.value"
                />
              </td>
              <td>
                <tooltip-icon-button
                  left
                  plain
                  small
                  color="primary"
                  icon="mdi-magnify"
                  :disabled="isSearchingValue || !entry.value"
                  :label="$t('idCopyDialog.searchDescription')"
                  @click="handleEvent('searchValue')"
                />
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
      <v-card-actions>
        <v-btn
          v-if="editMode"
          text
          color="primary"
          class="save"
          @click="handleEvent('save')"
        >
          {{ $t("idCopyDialog.save") }}
        </v-btn>
        <v-btn
          v-else-if="editVisible"
          text
          color="primary"
          class="edit"
          :disabled="!editable"
          @click="handleEvent('edit')"
        >
          {{ $t("idCopyDialog.edit") }}
        </v-btn>
        <v-btn
          v-else
          text
          color="primary"
          class="copy-link"
          @click="handleEvent('copyLink')"
        >
          {{ $t("idCopyDialog.copyLink") }}
        </v-btn>
        <v-spacer />
        <v-btn
          text
          color="primary"
          class="close"
          @click="handleEvent('close')"
        >
          {{ $t("idCopyDialog.close") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import SearchEngine from "@/core/SearchEngine.js";
import TooltipIconButton from "@/components/TooltipIconButton.vue";
import CopyableTextLabel from "@/components/CopyableTextLabel.vue";

export default {
  components: {
    TooltipIconButton,
    CopyableTextLabel,
  },

  model: {
    prop: "visible",
    event: "visibility-changed",
  },

  props: {
    visible: Boolean,
    editable: Boolean,
    state: {
      type: Object,
      required: true,
    },
    entry: {
      type: Object,
      required: true,
    },
  },

  data: () => ({
    editMode: false,
    editVisible: false,
    memory: {
      key: "",
      value: "",
    },
  }),

  computed: {
    rawEnumName() {
      return SearchEngine.getEnumInfo(this.entry.enumId).name;
    },
    enumName() {
      if (this.isGlobalSearch) {
        return this.$t("idCopyDialog.enumWhenGlobal", [this.rawEnumName]);
      } else {
        return this.rawEnumName;
      }
    },
    isCurrentEnum() {
      return this.entry.enumId == this.state.enumId;
    },
    isGlobalSearch() {
      return this.state.enumId == SearchEngine.globalSearchEnumId;
    },
    isSearchingKey() {
      return this.state.searchText == this.entry.key;
    },
    isSearchingValue() {
      return this.state.searchText == this.entry.value;
    },
    urlHash() {
      return [
        "#" + this.state.versionType + "-" + this.state.branchId,
        this.state.enumId,
        encodeURIComponent(this.entry.key),
      ].join("/");
    },
  },

  watch: {
    visible(newValue) {
      if (newValue) {
        this.editMode = false;
        this.editVisible = this.editable && this.entry.enumId != null;
      }
    },
  },

  methods: {
    copyEntryLink() {
      const reqUrl = location.origin + location.pathname + location.search;
      this.$copyText(reqUrl + this.urlHash, "idCopyDialog.linkCopiedPrompt");
    },
    handleEvent(eventType) {
      switch (eventType) {
        case "jumpTo":
          this.$emit("update", {
            enumId: this.entry.enumId,
          });
          this.$toast(this.$t("idCopyDialog.jumpToPrompt", [this.rawEnumName]));
          break;
        case "searchGlobal":
          this.$emit("update", {
            enumId: SearchEngine.globalSearchEnumId,
          });
          if (!this.state.searchText) {
            this.$emit("update", {
              searchText: this.entry.key,
            });
          }
          this.$toast(this.$t("idCopyDialog.searchGlobalPrompt"));
          break;
        case "searchId":
          this.$emit("update", {
            searchText: this.entry.key,
          });
          this.$toast(
            this.$t("idCopyDialog.replaceSearchPrompt", [this.entry.key])
          );
          break;
        case "searchValue":
          this.$emit("update", {
            searchText: this.entry.value,
          });
          this.$toast(
            this.$t("idCopyDialog.replaceSearchPrompt", [this.entry.value])
          );
          break;
        case "edit":
          this.editMode = true;
          this.memory.key = this.entry.key;
          this.memory.value = this.entry.value;
          break;
        case "save":
          this.editMode = false;
          this.$emit("update", {
            entryKey: this.memory.key,
            entryValue: this.memory.value,
          });
          break;
        case "copyLink":
          this.copyEntryLink();
          break;
        case "close":
          this.$emit("visibility-changed", false);
          break;
      }
    },
    onKeyDown(event) {
      if (event.key == "Enter") {
        if (this.editMode) {
          this.handleEvent("save");
        } else {
          this.handleEvent("close");
        }
      }
    }
  },
};
</script>

<style>
div.id-dialog-table tr > td:nth-of-type(1) {
  white-space: nowrap;
  width: 0;
}
div.id-dialog-table tr > td:nth-of-type(3) {
  white-space: nowrap;
  width: 0;
  text-align: right;
}
div.id-dialog-table.hide-actions tr > td:nth-of-type(3) {
  display: none;
}
div.id-dialog-table tr > td {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}
</style>