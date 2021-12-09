import Vue from 'vue'
import App from './App.vue'
import GlobalSnackBar from './plugins/snackbar'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app');

Vue.use(GlobalSnackBar);
