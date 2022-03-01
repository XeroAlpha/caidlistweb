import Vue from "vue";

const HistoryState = {
    states: {},
    pendingSync: false,
    bindReactiveObject(reactiveObj, fields) {
        fields.forEach((field) => {
            Object.defineProperty(this.states, field, {
                configurable: true,
                enumerable: true,
                get() {
                    return reactiveObj[field];
                },
                set(v) {
                    reactiveObj[field] = v;
                }
            });
        });
    },
    watchFields(boundComponent, fields) {
        fields.forEach((field) => {
            boundComponent.$watch(
                () => {
                    return this.states[field];
                },
                () => {
                    this.triggerSync();
                }
            );
        });
    },
    registerListener() {
        const state = Object.assign({}, this.states);
        history.replaceState(state, document.title);
        window.addEventListener("popstate", (ev) => {
            if (!ev.state) return;
            this.updateState(ev.state);
        });
    },
    updateState(state) {
        for (let k in state) {
            if (k in this.states) {
                this.states[k] = state[k];
            }
        }
    },
    syncState() {
        const state = Object.assign({}, this.states);
        if (history.state) {
            const stateChanged = Object.keys(state).some((k) => state[k] != history.state[k]);
            if (stateChanged) {
                history.pushState(state, document.title);
            }
        }
    },
    triggerSync() {
        if (!this.pendingSync) {
            this.pendingSync = true;
            Vue.nextTick(() => {
                this.syncState();
                this.pendingSync = false;
            });
        }
    }
};

export default HistoryState;
