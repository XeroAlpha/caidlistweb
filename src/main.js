import Vue from "vue";
import App from "@/App.vue";
import GlobalSnackBar from "@/plugins/snackbar";
import PWA from "@/plugins/pwa";
import LocalStorage from "@/plugins/localStorage";
import Clipboard from "@/plugins/clipboard";
import vuetify from "@/plugins/vuetify";
import i18n from "@/plugins/i18n";

import "@mdi/font/css/materialdesignicons.css";
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-500.css";
import "@fontsource/noto-sans-sc/chinese-simplified-400.css";
import "@fontsource/noto-sans-sc/chinese-simplified-500.css";
import zhHans from "vuetify/lib/locale/zh-Hans";

Vue.config.productionTip = false;
Vue.config.devtools = true;

Vue.use(GlobalSnackBar);
Vue.use(PWA);
Vue.use(LocalStorage);
Vue.use(Clipboard);

new Vue({
    i18n,
    locale: {
        locales: { zhHans },
        current: "zhHans"
    },
    vuetify,
    render: (h) => h(App)
}).$mount("#app");
