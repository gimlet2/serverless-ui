/* ============
 * Axios
 * ============
 *
 * Promise based HTTP client for the browser and node.js.
 * Because Vue Resource has been retired, Axios will now been used
 * to perform AJAX-requests.
 *
 * https://github.com/mzabriskie/axios
 */

import Vue from 'vue';
import Axios from 'axios';
import store from '@/store';

// Axios.defaults.baseURL = config.API_LOCATION;
Axios.defaults.headers.common.Accept = 'application/json';

// Add a request interceptor
// Axios.interceptors.request.use(function (config) {
//   // Do something before request is sent
//   console.log('Axios will send new request', JSON.stringify(config, undefined, 2));
//   return config;
// }, function (error) {
//   // Do something with request error
//   return Promise.reject(error);
// });

function createAxiosResponseInterceptor() {
  var axiosResponseInterceptor = Axios.interceptors.response.use(
    (response) => {
      // console.log('Axios received', JSON.stringify(response, undefined, 2));
      return response
    },
    (error) => {
      // console.error(`Axios intercepted ${error.response.status} response`, JSON.stringify(error, undefined, 2));

      if (error.response.status === 401) {
        // console.log("401 received", JSON.stringify(error));

        // disable this interceptor before calling the /oauth/token
        // so when /oauth/token will returns 401 from expired refresh_token
        // we wont have a infinite loop
        Axios.interceptors.response.eject(axiosResponseInterceptor);

        return store.dispatch('auth/relogin').then(() => {
          error.response.config.headers['Authorization'] = Axios.defaults.headers.common['Authorization'];
          return Axios(error.response.config); // retry original request
        }).finally(() => createAxiosResponseInterceptor()); // reenable interceptor
      }

      return Promise.reject(error);
    });
}

createAxiosResponseInterceptor();

// Bind Axios to Vue.
Vue.$http = Axios;
Object.defineProperty(Vue.prototype, '$http', {
  get() {
    return Axios;
  },
});
