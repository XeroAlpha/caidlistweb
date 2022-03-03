import { VSnackbar, VBtn } from "vuetify/lib/components";

const SnackBarComponent = {
    name: "GlobalSnackBar",
    data: {
        visible: false,
        timeout: 5000,
        text: "",
        actions: []
    },
    render(h) {
        return h(
            VSnackbar,
            {
                props: {
                    value: this.visible,
                    timeout: this.timeout
                },
                on: {
                    input: (v) => {
                        this.visible = v;
                    }
                },
                scopedSlots: {
                    action: () => {
                        return h(
                            "div",
                            this.actions.map((action) => {
                                return h(
                                    VBtn,
                                    {
                                        props: {
                                            color: "highlight",
                                            text: true
                                        },
                                        on: {
                                            click: () => {
                                                action.action();
                                                this.visible = false;
                                            }
                                        }
                                    },
                                    [action.text]
                                );
                            })
                        );
                    }
                }
            },
            this.text.split("\n").map((line) => h("div", [line]))
        );
    }
};

const snackBarSymbol = "__snackBar__component__";

export default function (Vue) {
    Vue.prototype.$toast = function (text, options) {
        let snackBarComponent = this.$root[snackBarSymbol];
        if (!snackBarComponent) {
            let snackBarEl = document.createElement("div");
            snackBarComponent = new Vue({
                ...SnackBarComponent,
                parent: this.$root
            });
            this.$root.$el.append(snackBarEl);
            snackBarComponent.$mount(snackBarEl);
            this.$root[snackBarSymbol] = snackBarComponent;
        }
        snackBarComponent.timeout = -1;
        this.$nextTick(() => {
            const opts = options || {};
            snackBarComponent.visible = true;
            snackBarComponent.text = text;
            snackBarComponent.timeout = opts.timeout || 5000;
            let actions;
            if (opts.actions) {
                actions = opts.actions;
            } else if (opts.action) {
                actions = [opts.action];
            } else {
                actions = [null];
            }
            snackBarComponent.actions = actions.map((action) => {
                return action || { text: this.$t("toast.close"), action: () => void 0 };
            });
        });
    };
}
