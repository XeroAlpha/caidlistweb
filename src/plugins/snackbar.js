import { VSnackbar, VBtn } from "vuetify/lib/components";

const SnackBarComponent = {
    name: "GlobalSnackBar",
    data: {
        visible: false,
        timeout: 5000,
        text: ""
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
                            VBtn,
                            {
                                props: {
                                    color: "highlight",
                                    text: true
                                },
                                on: {
                                    click: () => {
                                        this.visible = false;
                                    }
                                }
                            },
                            ["关闭"]
                        );
                    }
                }
            },
            [this.text]
        );
    }
};

const snackBarSymbol = "__snackBar__component__";

export default function (Vue) {
    Vue.prototype.$toast = function (text, timeout) {
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
            snackBarComponent.visible = true;
            snackBarComponent.text = text;
            snackBarComponent.timeout = timeout || 5000;
        });
    };
}
