import Vue from "vue";
import Indexes from "../assets/dataIndex.json";
import Corrections from "../assets/corrections.json";

function delayedValue(ms, value) {
    return new Promise((resolve) => setTimeout(resolve, ms, value));
}

function nextAnimationFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * @template Request
 * @param {Request} request
 * @param {(request: Request) => void} action
 * @returns {Promise<Request["result"]>}
 */
function completeDBRequest(request, action) {
    return new Promise((resolve, reject) => {
        request.addEventListener("success", () => resolve(request.result));
        request.addEventListener("error", () => reject(request.error));
        if (action) {
            action(request);
        }
    });
}

/**
 * @template {string | string[]} StoreNames
 * @param {IDBDatabase} db
 * @param {StoreNames} storeNames
 * @param {IDBTransactionMode} mode
 * @param {(stores: StoreNames extends string ? IDBObjectStore : Record<string, IDBObjectStore>) => void} action
 * @returns {Promise<void>}
 */
function withTransaction(db, storeNames, mode, action) {
    const transaction = db.transaction(storeNames, mode);
    let stores;
    if (Array.isArray(storeNames)) {
        storeNames.forEach((name) => (stores[name] = transaction.objectStore(name)));
    } else {
        stores = transaction.objectStore(storeNames);
    }
    action(stores);
    return new Promise((resolve, reject) => {
        transaction.addEventListener("complete", () => resolve());
        transaction.addEventListener("error", () => reject(transaction.error));
    });
}

const globalSearchMaxCount = 100;
const chunkSize = 32;
const stepTimeLimit = 10;

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
        enumList: [],
        /** @type {IDBDatabase} */
        db: null
    },
    indexes: Object.freeze(Indexes),
    state: Vue.observable({
        versionType: null,
        versionName: null,
        branchId: null,
        branchName: null,
        dataVersion: null,
        coreVersion: null,
        offlineUrl: null,
        enumList: [gloablSearchEnum],
        ready: false
    }),
    async updateState(versionIndex, branchInfo, branchData) {
        this.current.versionIndex = versionIndex;
        this.current.branchInfo = branchInfo;
        this.current.enums = branchData.enums;
        this.current.enumList = branchData.names.map((e) => ({
            id: e[0],
            name: e[1],
            description: e[2]
        }));
        try {
            this.current.db = await this.loadModifierDB(versionIndex.id, branchInfo.id);
            await this.applyModifiers(this.current.enums);
        } catch (err) {
            console.warn(err);
        }
        const state = this.state;
        state.versionType = versionIndex.id;
        state.versionName = versionIndex.name;
        state.branchId = branchInfo.id;
        state.branchName = branchInfo.name;
        state.dataVersion = versionIndex.dataVersion;
        state.coreVersion = versionIndex.coreVersion;
        state.offlineUrl = branchInfo.offlineUrl;
        state.enumList = [gloablSearchEnum, ...this.current.enumList];
        state.ready = true;
    },
    getVersionIndex(versionType) {
        return this.indexes.find((e) => e.id == versionType) || this.indexes[0];
    },
    getBranchInfo(versionIndex, branchId) {
        return versionIndex.branchList.find((e) => e.id == branchId) || versionIndex.branchList[0];
    },
    getBranchIdByIndex(versionType, index) {
        const versionIndex = this.getVersionIndex(versionType);
        const branchInfo = versionIndex.branchList[index];
        return branchInfo ? branchInfo.id : versionIndex.branchList[0].id;
    },
    getEnumInfo(enumId) {
        return this.state.enumList.find((e) => e.id == enumId) || this.state.enumList[0];
    },
    async loadBranch(versionType, branchId) {
        this.state.ready = false;
        const versionIndex = this.getVersionIndex(versionType);
        const branchInfo = this.getBranchInfo(versionIndex, branchId);
        const branchData = await (await fetch(branchInfo.dataUrl)).json();
        await this.updateState(versionIndex, branchInfo, branchData);
    },
    newSearchSession() {
        const reactiveSession = Object.assign(
            Vue.observable({
                idle: true,
                progress: 0,
                globalSearch: true,
                showNotFound: false,
                error: null,
                results: [],
                correction: null,
                enumSize: 0
            }),
            {
                currentSearch: null,
                pendingSearch: null
            }
        );
        return reactiveSession;
    },
    updateSession(session, newState) {
        if (!this.state.ready) return;
        if (session.idle) {
            session.idle = false;
            session.currentSearch = newState;
            (async () => {
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
            })();
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
            const esc = e[0].replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
            correction = correction.replace(new RegExp(esc, "ig"), e[1]);
        });
        Corrections.patterns.forEach((e) => {
            correction = correction.replace(new RegExp(e[0], "ig"), e[1]);
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
        const searchText = this.preprocessSearchText(text);
        session.progress = 0;
        session.results.splice(0); // remove all elements
        session.error = searchText.error;
        if (!searchText.error) {
            if (enumId == gloablSearchEnum.id) {
                session.globalSearch = true;
                session.enumSize = -1;
                if (text.length) {
                    const progressPerEnum = 100 / enumList.length;
                    let i;
                    for (i = 0; i < enumList.length; i++) {
                        const selectedEnum = enums[enumList[i].id];
                        const enumEntries = Object.entries(selectedEnum);
                        await this.doSearchEnum(session, enumList[i].id, enumEntries, searchText, (subprogress) => {
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
                await this.doSearchEnum(session, enumId, enumEntries, searchText, (progress) => {
                    session.progress = progress * 100;
                });
            }
        }
        session.progress = 0;
        session.showNotFound = session.results.length == 0;
    },
    async doSearchEnum(session, enumId, enumEntries, searchText, reportProgress) {
        const enumLength = enumEntries.length;
        let i, chunk, stepChunkCount, stepStartTime, stepEndTime;
        stepStartTime = Date.now();
        stepChunkCount = 0;
        for (i = 0; i < enumEntries.length; i += chunkSize) {
            stepChunkCount++;
            chunk = enumEntries.slice(i, i + chunkSize);
            chunk = this.doSearchEnumChunk(enumId, chunk, searchText);
            reportProgress(i / enumLength);
            while (chunk.length) {
                session.results.push(chunk.shift());
                session.showNotFound = false;
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
        await Vue.nextTick();
        await nextAnimationFrame();
    },
    doSearchEnumChunk(enumId, chunk, searchText) {
        if (!searchText.empty) {
            chunk = chunk
                .map(([key, value]) => {
                    const keyHighlight = this.doSearchValueHighlighted(key, searchText);
                    const valueHighlight = this.doSearchValueHighlighted(value, searchText);
                    if (keyHighlight || valueHighlight) {
                        return { enumId, key, value, keyHighlight, valueHighlight };
                    } else {
                        return null;
                    }
                })
                .filter((result) => result != null);
        } else {
            chunk = chunk.map(([key, value]) => {
                return { enumId, key, value };
            });
        }
        return chunk;
    },
    preprocessSearchText(text) {
        const textLength = text.length;
        if (textLength == 0) return { empty: true };
        if (text.startsWith("~")) {
            try {
                let regex;
                if (text.startsWith("~*")) {
                    regex = new RegExp(text.slice(2), "i");
                } else {
                    regex = new RegExp(text.slice(1));
                }
                return {
                    type: "regexMatches",
                    regex
                };
            } catch (err) {
                if (err instanceof SyntaxError) {
                    return { error: err.message };
                }
                throw err;
            }
        }
        if (text.startsWith("=")) {
            return {
                type: "equals",
                text: text.slice(1),
                textLength: textLength - 1
            };
        }
        if (text.startsWith("^")) {
            return {
                type: "startsWith",
                text: text.slice(1),
                textLength: textLength - 1
            };
        }
        if (text.startsWith("!")) {
            return {
                type: "contains",
                text: text.slice(1),
                textLength: textLength - 1
            };
        }
        return {
            type: "keywordSearch",
            texts: text
                .toLowerCase()
                .split(/\s+/)
                .filter((e) => e.length > 0)
        };
    },
    doSearchValueHighlighted(value, searchText) {
        const positions = this.doSearchValue(value, searchText);
        if (positions) {
            const result = [];
            let start = 0;
            for (const end of positions) {
                result.push(value.slice(start, end));
                start = end;
            }
            result.push(value.slice(start));
            return result;
        }
        return null;
    },
    doSearchValue(value, searchText) {
        if (searchText.type == "regexMatches") {
            const match = searchText.regex.exec(value);
            if (match) {
                return [match.index, match.index + match[0].length];
            }
        } else if (searchText.type == "keywordSearch") {
            const { texts } = searchText;
            const valueLowerCase = value.toLowerCase();
            const result = [];
            let start = 0;
            for (const textPart of texts) {
                const indexInValue = valueLowerCase.indexOf(textPart, start);
                if (indexInValue >= 0) {
                    start = indexInValue + textPart.length;
                    result.push(indexInValue, start);
                } else {
                    return null;
                }
            }
            return result;
        } else if (searchText.type == "equals") {
            const { text, textLength } = searchText;
            if (value == text) {
                return [0, textLength];
            }
        } else if (searchText.type == "startsWith") {
            const { text, textLength } = searchText;
            if (value.startsWith(text)) {
                return [0, textLength];
            }
        } else if (searchText.type == "contains") {
            const { text, textLength } = searchText;
            const indexInValue = value.indexOf(text);
            if (indexInValue >= 0) {
                return [indexInValue, indexInValue + textLength];
            }
        }
        return null;
    },
    async updateEnumEntry(enumId, key, value) {
        const selectedEnum = this.current.enums[enumId];
        if (selectedEnum && key in selectedEnum && selectedEnum[key] != value) {
            selectedEnum[key] = value;
            await this.setModifier(enumId, key, value);
        }
    },
    async loadModifierDB() {
        return await completeDBRequest(indexedDB.open("search-engine", 1), (req) => {
            req.addEventListener("upgradeneeded", (ev) => {
                const db = req.result;
                if (ev.oldVersion < 1) {
                    const store = db.createObjectStore("modifiers", {
                        keyPath: ["versionType", "branchId", "enumId", "key"]
                    });
                    store.createIndex("enumId", ["versionType", "branchId", "enumId"], { unique: false });
                    store.createIndex("branchId", ["versionType", "branchId"], { unique: false });
                }
            });
        });
    },
    async applyModifiers(enumMap) {
        const { db, versionIndex, branchInfo } = this.current;
        await withTransaction(db, "modifiers", "readwrite", async (store) => {
            const index = store.index("branchId");
            const modifiers = await completeDBRequest(index.getAll([versionIndex.id, branchInfo.id]));
            modifiers.forEach((modifier) => {
                const enumEntries = enumMap[modifier.enumId];
                if (enumEntries) {
                    if (modifier.key in enumEntries) {
                        if (enumEntries[modifier.key] != modifier.value) {
                            enumEntries[modifier.key] = modifier.value;
                        } else {
                            store.delete([versionIndex.id, branchInfo.id, modifier.enumId, modifier.key]);
                        }
                    }
                }
            });
        });
    },
    async setModifier(enumId, key, value, action) {
        const { db, versionIndex, branchInfo } = this.current;
        await withTransaction(db, "modifiers", "readwrite", async (store) => {
            const modifierKV = {};
            if (action) {
                modifierKV[action] = true;
            }
            store.put({
                versionType: versionIndex.id,
                branchId: branchInfo.id,
                enumId,
                key,
                value,
                ...modifierKV
            });
        });
    },
    async exportModifiers() {
        const { db } = this.current;
        let name, data;
        await withTransaction(db, "modifiers", "readwrite", async (store) => {
            name = store.name;
            data = await completeDBRequest(store.getAll());
        });
        return Buffer.from(
            JSON.stringify({
                version: db.version,
                name,
                data
            })
        );
    },
    async loadModifiers(buffer) {
        const { db } = this.current;
        let data = JSON.parse(buffer.toString());
        await withTransaction(db, "modifiers", "readwrite", async (store) => {
            if (data.name == store.name && data.version == db.version) {
                data.data.forEach((e) => store.put(e));
            } else {
                throw "database signature mismatch";
            }
        });
    }
};

export default SearchEngine;
