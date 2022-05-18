<template>
  <v-dialog
    :value="visible"
    max-width="500px"
    @input="$emit('visibility-changed', $event)"
  >
    <v-list
      class="branch-menu overflow-y-auto"
      max-height="90vh"
    >
      <v-list-group
        v-model="versionGroup"
        class="version-group"
      >
        <template #activator>
          <v-list-item-content>
            <v-list-item-title>
              {{
                $t("branchMenu.currentVersion", [
                  $t("branchMenu.versionTemplate", [
                    versionIndex.name,
                    versionIndex.coreVersion,
                  ]),
                ])
              }}
            </v-list-item-title>
          </v-list-item-content>
        </template>
        <v-list-item
          v-for="(e, i) in versionIndexes"
          :key="i"
          @click="pendingVersionType = e.id"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{ $t("branchMenu.versionTemplate", [e.name, e.coreVersion]) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ e.description }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-icon v-if="versionIndex == e">
            mdi-check
          </v-icon>
        </v-list-item>
      </v-list-group>
      <v-divider />
      <v-list-group
        v-model="branchGroup"
        class="branch-group"
      >
        <template #activator>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t("branchMenu.currentBranch", [branchInfo.name]) }}
            </v-list-item-title>
          </v-list-item-content>
        </template>
        <v-list-item
          v-for="(e, i) in branchList"
          :key="i"
          @click="pendingBranchId = e.id"
        >
          <v-list-item-content>
            <v-list-item-title>
              {{ e.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ e.description }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-icon v-if="branchInfo == e">
            mdi-check
          </v-icon>
        </v-list-item>
      </v-list-group>
      <v-divider />
      <v-list-item
        class="close-branch-menu"
        link
        @click="$emit('visibility-changed', false)"
      >
        <v-list-item-content>
          <v-list-item-title>
            {{ $t("branchMenu.close") }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-dialog>
</template>

<script>
import SearchEngine from "@/core/SearchEngine.js";

export default {
  model: {
    prop: "visible",
    event: "visibility-changed",
  },

  props: {
    visible: Boolean,
    versionType: {
      type: String,
      default: "",
    },
    branchId: {
      type: String,
      default: "",
    },
    group: {
      type: String,
      default: "",
    },
  },

  data: () => ({
    versionGroup: false,
    branchGroup: true,
    pendingVersionType: "",
    pendingBranchId: "",
  }),

  computed: {
    versionIndexes() {
      return SearchEngine.indexes;
    },
    versionIndex() {
      return SearchEngine.getVersionIndex(this.pendingVersionType);
    },
    branchList() {
      return this.versionIndex.branchList;
    },
    branchInfo() {
      return SearchEngine.getBranchInfo(
        this.versionIndex,
        this.pendingBranchId
      );
    },
  },

  watch: {
    visible(newValue) {
      if (newValue) {
        this.pendingVersionType = this.versionType;
        this.pendingBranchId = this.branchId;
        this.versionGroup = false;
        this.branchGroup = false;
        if (this.group == "version") {
          this.versionGroup = true;
        } else if (this.group == "branch") {
          this.branchGroup = true;
        }
      } else {
        this.triggerChange();
      }
    },
  },

  methods: {
    triggerChange() {
      this.$emit("change", {
        versionType: this.pendingVersionType,
        branchId: this.pendingBranchId,
      });
    },
  },
};
</script>

<style>
.branch-menu .v-list-item__subtitle {
  white-space: normal;
}
</style>