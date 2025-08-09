import Vue from 'vue';
import App from './App.vue';
import * as echarts from 'echarts';

Vue.config.productionTip = false;

// Expose ECharts if needed by components
(Vue as any).prototype.$echarts = echarts;

new Vue({
  render: h => h(App),
}).$mount('#app');
