import Vue from "vue";
import Indexes from "../assets/dataIndex.json";
import Corrections from "../assets/corrections.json";

function delayedValue(ms, value) {
    return new Promise((resolve) => setTimeout(resolve, ms, value));
}

function nextAnimationFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
}

const globalSearchMaxCount = 100;
const chunkSize = 32;
const stepTimeLimit = 15;

const gloablSearchEnum = {
    id: "#global",
    name: "globalSearch.name",
    description: "globalSearch.description",
    translate: true
};

const SearchEngine = {
    globalSearchEnumId: gloablSearchEnum.id,
    current: {
        versionIndex: null,
        branchInfo: null,
        enums: {},
        enumList: []
    },
    indexes: Object.freeze(Indexes),
    state: Vue.observable({
        versionType: null,
        versionName: null,
        branchId: null,
        branchName: null,
        dataVersion: null,
        offlineUrl: null,
        enumList: [gloablSearchEnum],
        ready: false
    }),
    updateState(versionIndex, branchInfo, branchData) {
        this.current.versionIndex = versionIndex;
        this.current.branchInfo = branchInfo;
        this.current.enums = branchData.enums;
        this.current.enumList = branchData.names.map((e) => ({
            id: e[0],
            name: e[1],
            description: e[2]
        }));
        const state = this.state;
        state.versionType = versionIndex.id;
        state.versionName = versionIndex.name;
        state.branchId = branchInfo.id;
        state.branchName = branchInfo.name;
        state.dataVersion = versionIndex.dataVersion;
        state.offlineUrl = branchInfo.offlineUrl;
        state.enumList = [gloablSearchEnum, ...this.current.enumList];
        state.ready = true;
    },
    mapState() {
        const getters = {};
        let k;
        for (k in this.state) {
            getters[k] = () => this.state[k];
        }
        return getters;
    },
    async loadBranch(versionType, branch) {
        let versionIndex, branchInfo, branchData;
        versionIndex = this.indexes.find((e) => e.id == versionType);
        if (!versionIndex) versionIndex = this.indexes[0];
        branchInfo = versionIndex.branchList.find((e) => e.id == branch);
        if (!branchInfo) branchInfo = versionIndex.branchList[0];
        branchData = await (await fetch(branchInfo.dataUrl)).json();
        this.updateState(versionIndex, branchInfo, branchData);
    },
    newSearchSession() {
        const reactiveSession = Object.assign(
            Vue.observable({
                idle: true,
                progress: 0,
                globalSearch: true,
                showNotFound: false,
                results: [],
                correction: null,
                enumSize: 0
            }),
            {
                currentSearch: null,
                pendingSearch: null,
                splitJobs: false
            }
        );
        return reactiveSession;
    },
    updateSession(session, newState) {
        if (!this.state.ready) return;
        if (session.idle) {
            session.idle = false;
            session.currentSearch = newState;
            (async function () {
                try {
                    await this.doJob(session);
                    await delayedValue(100);
                    while (session.pendingSearch) {
                        session.currentSearch = session.pendingSearch;
                        session.pendingSearch = null;
                        await this.doJob(session);
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    session.idle = true;
                }
            }).call(this);
        } else {
            session.pendingSearch = newState;
        }
    },
    doJob(session) {
        this.doCorrection(session);
        return this.doSearch(session);
    },
    doCorrection(session) {
        const { text } = session.currentSearch;
        let correction = text;
        Corrections.words.forEach((e) => {
            correction = correction.replace(e[0], e[1]);
        });
        Corrections.patterns.forEach((e) => {
            correction = correction.replace(new RegExp(e[0], "g"), e[1]);
        });
        if (correction != text) {
            session.correction = correction;
        } else {
            session.correction = null;
        }
    },
    async doSearch(session) {
        const { enumId, text } = session.currentSearch;
        const { enums, enumList } = this.current;
        const textLowerCase = text.toLowerCase();
        session.progress = 0;
        session.results.splice(0); // remove all elements
        if (enumId == gloablSearchEnum.id) {
            session.globalSearch = true;
            session.enumSize = -1;
            if (text.length) {
                const progressPerEnum = 100 / enumList.length;
                let i;
                for (i = 1; i < enumList.length; i++) {
                    const selectedEnum = enums[enumList[i].id];
                    const enumEntries = Object.entries(selectedEnum);
                    await this.doSearchEnum(session, enumId, enumEntries, textLowerCase, (subprogress) => {
                        session.progress = progressPerEnum * (i + subprogress);
                    });
                    if (session.pendingSearch || session.results.length > globalSearchMaxCount) {
                        break;
                    }
                }
            }
        } else if (enumId in enums) {
            session.globalSearch = false;
            const selectedEnum = enums[enumId];
            const enumEntries = Object.entries(selectedEnum);
            session.enumSize = enumEntries.length;
            await this.doSearchEnum(session, enumId, enumEntries, textLowerCase, (progress) => {
                session.progress = progress * 100;
            });
        }
        session.progress = 0;
        session.showNotFound = session.results.length == 0;
    },
    async doSearchEnum(session, enumId, enumEntries, textLowerCase, reportProgress) {
        const enumLength = enumEntries.length;
        let i, chunk, stepChunkCount, stepStartTime, stepEndTime;
        stepStartTime = Date.now();
        stepChunkCount = 0;
        console.time("search:" + textLowerCase);
        for (i = 0; i < enumEntries.length; i += chunkSize) {
            stepChunkCount++;
            chunk = enumEntries.slice(i, i + chunkSize);
            chunk = this.doSearchEnumChunk(enumId, chunk, textLowerCase);
            reportProgress(i / enumLength);
            while (chunk.length) {
                session.results.push(chunk.shift());
                session.showNotFound = false;
                if (session.splitJobs) {
                    await Vue.nextTick(); // trigger UI update
                }
            }
            stepEndTime = Date.now();
            if (stepEndTime - stepStartTime > stepTimeLimit) {
                await nextAnimationFrame();
                console.log("Animation frame", stepEndTime - stepStartTime, stepChunkCount);
                stepStartTime = Date.now();
                stepChunkCount = 0;
            }
            if (session.pendingSearch) {
                break;
            }
        }
        console.timeEnd("search:" + textLowerCase);
        await Vue.nextTick();
    },
    doSearchEnumChunk(enumId, chunk, textLowerCase) {
        const textLength = textLowerCase.length;
        if (textLength) {
            chunk = chunk
                .map(([key, value]) => {
                    let indexInKey = key.toLowerCase().indexOf(textLowerCase);
                    let indexInValue = value.toLowerCase().indexOf(textLowerCase);
                    if (indexInKey >= 0 || indexInValue >= 0) {
                        let result = { enumId, key, value };
                        if (indexInKey >= 0) {
                            result = {
                                ...result,
                                keyHighlight: true,
                                keyPre: key.slice(0, indexInKey),
                                keyHl: key.slice(indexInKey, indexInKey + textLength),
                                keyPost: key.slice(indexInKey + textLength)
                            };
                        }
                        if (indexInValue >= 0) {
                            result = {
                                ...result,
                                valueHighlight: true,
                                valuePre: value.slice(0, indexInValue),
                                valueHl: value.slice(indexInValue, indexInValue + textLength),
                                valuePost: value.slice(indexInValue + textLength)
                            };
                        }
                        return result;
                    } else {
                        return null;
                    }
                })
                .filter((result) => result != null);
        } else {
            chunk = chunk.map(([key, value]) => {
                return { key, value };
            });
        }
        return chunk;
    }
};

export default SearchEngine;
