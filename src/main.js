import Vue from 'vue'
import App from './App.vue'
import GlobalSnackBar from './plugins/snackbar'
import PWA from './plugins/pwa'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

Vue.use(GlobalSnackBar);
Vue.use(PWA);

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app');
