import Proxy from './Proxy';

class FunctionProxy extends Proxy {
  /**
   * The constructor for the DeciderProxy.
   *
   * @param {Object} parameters The query parameters.
   */
  constructor(parameters = {}) {
    super('api', parameters);
  }

  list(params = {}) {
    return this.submit('get', `/api/functions`, null, { params });
  }

  fetchByName(ns, name) {
    return this.submit('get', `/api/function/${ns}/${name}`, null, {});
  }
  
  files(ns, name) {
    return this.submit('get', `/api/function/${ns}/${name}/files`, null, {});
  }
  
  file(ns, name, file) {
    return this.submit('get', `/api/function/${ns}/${name}/files/?file=${file}`, null, {});
  }
}

export default FunctionProxy;
