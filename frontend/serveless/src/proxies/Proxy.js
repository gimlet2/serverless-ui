import Vue from 'vue';

class BaseProxy {
  /**
   * The constructor of the BaseProxy.
   *
   * @param {string} endpoint   The endpoint being used.
   * @param {Object} parameters The parameters for the request.
   */
  constructor(endpoint, parameters = {}) {
    this.endpoint = endpoint;
    this.parameters = parameters;
  }

  /**
   * Method used to set the query parameters.
   *
   * @param {Object} parameters The given parameters.
   *
   * @returns {BaseProxy} The instance of the proxy.
   */
  setParameters(parameters) {
    Object.keys(parameters).forEach(key => {
      this.parameters[key] = parameters[key];
    });

    return this;
  }

  /**
   * Method used to set a single parameter.
   *
   * @param {string} parameter The given parameter.
   * @param {*} value The value to be set.
   *
   * @returns {BaseProxy} The instance of the proxy.
   */
  setParameter(parameter, value) {
    this.parameters[parameter] = value;

    return this;
  }

  /**
   * Method used to remove all the parameters.
   *
   * @param {Array} parameters The given parameters.
   *
   * @returns {BaseProxy} The instance of the proxy.
   */
  removeParameters(parameters) {
    parameters.forEach(parameter => {
      delete this.parameters[parameter];
    });

    return this;
  }

  /**
   * Method used to remove a single parameter.
   *
   * @param {string} parameter The given parameter.
   *
   * @returns {BaseProxy} The instance of the proxy.
   */
  removeParameter(parameter) {
    delete this.parameters[parameter];

    return this;
  }

  /**
   * The method used to perform an AJAX-request.
   *
   * @param {string}      method      The http request type ('get', 'post, 'delete', ...).
   * @param {string}      url         The URL for the request.
   * @param {Object|null} data        The data to be send with the request.
   *
   * @returns {Promise} The result in a promise.
   */
  submit(method, url, data = null, config = {}) {
    return new Promise((resolve, reject) => {
      Vue.$http({
        method,
        url,
        data,
        ...config,
        params: { ...this.parameters, ...config.params },
      })
        .then(response => {
          resolve(response.data);
        })
        .catch(({ response }) => {
          if (response) {
            reject(response.data);
          } else {
            reject();
          }
        });
    });
  }

  /**
   * Method used to fetch all items from the API.
   *
   * @returns {Promise} The result in a promise.
   */
  all() {
    return this.submit('get', `/${this.endpoint}`);
  }

  /**
   * Method used to list items from the API.
   *
   * @param {Object} params Parameters to pass to the endpoint as queryString
   * @param {Number|String} params.id List items that contain this string in name (null by default)
   * @param {Number|String} params.name List items that contain this string in name
   *                                    (null by default)
   * @param {Number} params.page Zero based page number (0 by default)
   * @param {Number} params.size Number of elements in page (20 by default)
   * @param {String} params.sort Sorting collumn name and direction like: 'name,desc'
   *                             (null by default - no sorting)
   *
   * @returns {Promise} The result in a promise.
   */
  list(params = {}) {
    return this.submit('get', `/${this.endpoint}`, null, { params });
  }

  /**
   * Method used to fetch a single item from the API.
   *
   * @param {int} id The given identifier.
   *
   * @returns {Promise} The result in a promise.
   */
  find(id) {
    return this.submit('get', `/${this.endpoint}/${id}`);
  }

  /**
   * Method used to create an item.
   *
   * @param {Object} item The given item.
   *
   * @returns {Promise} The result in a promise.
   */
  create(item) {
    return this.submit('post', `/${this.endpoint}`, item);
  }

  /**
   * Method used to update an item.
   *
   * @param {int}    id   The given identifier.
   * @param {Object} item The given item.
   *
   * @returns {Promise} The result in a promise.
   */
  update(id, item) {
    return this.submit('put', `/${this.endpoint}/${id}`, item);
  }

  /**
   * Method used to destroy an item.
   *
   * @param {int} id The given identifier.
   *
   * @returns {Promise} The result in a promise.
   */
  destroy(id) {
    return this.submit('delete', `/${this.endpoint}/${id}`);
  }
}

export default BaseProxy;
