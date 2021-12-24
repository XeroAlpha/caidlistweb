import Vue from "vue";
import App from "./App.vue";
import GlobalSnackBar from "./plugins/snackbar";
import PWA from "./plugins/pwa";
import LocalStorage from "./plugins/localStorage";
import vuetify from "./plugins/vuetify";
import i18n from "./plugins/i18n";

Vue.config.productionTip = false;

Vue.use(GlobalSnackBar);
Vue.use(PWA);
Vue.use(LocalStorage);

new Vue({
    i18n,
    vuetify,
    render: (h) => h(App)
}).$mount("#app");
