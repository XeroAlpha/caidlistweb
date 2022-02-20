<template>
  <v-dialog
    scrollable
    :value="visible"
    :persistent="editMode"
    max-width="400px"
    @input="$emit('visibility-changed', $event)"
  >
    <v-card class="id-copy-dialog">
      <v-card-title class="id-key">
        {{ $t("idCopyDialog.title") }}
      </v-card-title>
      <v-simple-table class="id-dialog-table" :class="{ 'hide-actions': editMode }">
        <template v-slot:default>
          <tbody>
            <tr>
              <td>{{ $t("idCopyDialog.entryEnum") }}</td>
              <td>
                <copyable-text-label :text="enumName" />
              </td>
              <td>
                <tooltip-icon-button
                  left
                  plain
                  small
                  color="primary"
                  class="jump-to-enum"
                  icon="mdi-crosshairs"
                  :label="$t('idCopyDialog.jumpTo')"
                  v-if="isGlobalSearch"
                  @click="handleAndCloseDialog('jumpTo')"
                />
                <tooltip-icon-button
                  left
                  plain
                  small
                  color="primary"
                  class="jump-to-global"
                  icon="mdi-database-search-outline"
                  :label="$t('idCopyDialog.searchGlobal')"
                  v-else
                  @click="handleAndCloseDialog('searchGlobal')"
                />
              </td>
            </tr>
            <tr>
              <td>{{ $t("idCopyDialog.entryId") }}</td>
              <td>
                <v-text-field
                  v-model="memory.key"
                  dense
                  hide-details
                  disabled
                  class="text-body-2 mt-0 mb-1"
                  v-if="editMode"
                ></v-text-field>
                <copyable-text-label :text="entry.key" v-else />
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
                  @click="handleAndCloseDialog('searchId')"
                />
              </td>
            </tr>
            <tr v-if="entry.value || editMode">
              <td>{{ $t("idCopyDialog.entryValue") }}</td>
              <td>
                <v-text-field
                  v-model="memory.value"
                  dense
                  hide-details
                  class="text-body-2 mt-0 mb-1"
                  v-if="editMode"
                ></v-text-field>
                <copyable-text-label :text="entry.value" v-else />
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
                  @click="handleAndCloseDialog('searchValue')"
                />
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
      <v-card-actions>
        <v-btn
          text
          color="primary"
          class="save"
          v-if="editMode"
          @click="handleAndCloseDialog('save')"
        >
          {{ $t("idCopyDialog.save") }}
        </v-btn>
        <v-btn
          text
          color="primary"
          class="edit"
          :disabled="!editable"
          v-else-if="editVisible"
          @click="handleAndCloseDialog('edit')"
        >
          {{ $t("idCopyDialog.edit") }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          text
          color="primary"
          class="close"
          @click="handleAndCloseDialog('close')"
        >
          {{ $t("idCopyDialog.close") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import SearchEngine from "../core/SearchEngine.js";
import TooltipIconButton from "../components/TooltipIconButton.vue";
import CopyableTextLabel from "../components/CopyableTextLabel.vue";

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
    state: Object,
    entry: Object,
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
    enumName() {
      const enumName = SearchEngine.getEnumInfo(this.entry.enumId).name;
      if (this.isGlobalSearch) {
        return this.$t("idCopyDialog.enumWhenGlobal", [enumName]);
      } else {
        return enumName;
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
  },

  watch: {
    visible(newValue) {
      if (newValue) {
        this.editMode = false;
        this.editVisible = this.editable;
      }
    }
  },

  methods: {
    handleAndCloseDialog(eventType) {
      switch (eventType) {
        case "close":
          this.$emit("visibility-changed", false);
          break;
        case "jumpTo":
          this.$emit("update", {
            enumId: this.entry.enumId,
          });
          this.$toastT("idCopyDialog.jumpTo", [this.enumName]);
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
          this.$toastT("idCopyDialog.searchGlobal");
          break;
        case "searchId":
          this.$emit("update", {
            searchText: this.entry.key,
          });
          this.$toastT("idCopyDialog.replaceSearch", [this.entry.key]);
          break;
        case "searchValue":
          this.$emit("update", {
            searchText: this.entry.value,
          });
          this.$toastT("idCopyDialog.replaceSearch", [this.entry.value]);
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
      }
    },
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