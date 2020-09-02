import fs from 'fs-extra';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';

class SimpleStorage {

  /**
   * Path to disk storage.
   * @type {string|null}
   * @private
   */
  _dataFilePath = null;
  /**
   * Memory store.
   * @type {Object}
   * @private
   */
  _data = {};

  /**
   * Constructor. If data file is null will revert to memory only storage.
   * @param dataFilePath {string|null} Path to data storage on disk.
   */
  constructor(dataFilePath = null) {
    if (!dataFilePath)
      return; // memory only storage
    this._dataFilePath = dataFilePath;
    fs.ensureFileSync(dataFilePath);
    let data;
    try {
      data = fs.readJsonSync(dataFilePath);
    } catch(err) {
      data = {};
      fs.writeJsonSync(dataFilePath, data);
    }
    this._data = data;
  }

  saveData() {
    if (!this._dataFilePath)
      return; // memory only storage
    try {
      fs.writeJsonSync(this._dataFilePath, this._data);
    } catch(err) {
      console.error(err);
    }
  }

  getItem(key) {
    const item = this._data[key];
    if(!item) return item;
    return cloneDeep(item);
  }

  setItem(key, val, save=true) {
    if(!val) {
      this._data[key] = val;
    } else if (val instanceof Map || val instanceof Set) {
      this._data[key] = Array.from(val).map(t => cloneDeep(t));
    } else {
      this._data[key] = cloneDeep(val);
    }
    if (save)
      this.saveData();
    return val;
  }

  setItems(obj) {
    for(const [key, val] of Object.entries(obj))
      this.setItem(key, val, false);
    this.saveData();
    return obj;
  }

  removeItem(key) {
    const newData = omit(this._data, [key]);
    this._data = newData;
    this.saveData();
  }

  removeItems(keys) {
    const newData = omit(this._data, keys);
    this._data = newData;
    this.saveData();
  }

  clear() {
    this._data = {};
    this.saveData();
  }

}

export default SimpleStorage;
