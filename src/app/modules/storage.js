import fs from 'fs-extra';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';

class SimpleStorage {

  constructor(dataFilePath) {
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

  async saveData() {
    try {
      await fs.writeJsonSync(this._dataFilePath, this._data);
    } catch(err) {
      console.error(err);
    }
  }

  getItem(key) {
    const item = this._data[key];
    if(!item) return item;
    return cloneDeep(item);
  }

  setItem(key, val) {
    if(!val) {
      this._data[key] = val;
    } else {
      this._data[key] = cloneDeep(val);
    }
    this.saveData();
    return val;
  }

  setItems(obj) {
    for(const key of Object.keys(obj) ) {
      const val = obj[key];
      if(!val) {
        this._data[key] = val;
      } else {
        this._data[key] = cloneDeep(val);
      }
    }
    this.saveData();
    return obj;
  }

  removeItem(key) {
    const newData = omit(this._data, [key]);
    this._data = newData;
    this.saveData();
    return;
  }

  removeItems(keys) {
    const newData = omit(this._data, keys);
    this._data = newData;
    this.saveData();
    return;
  }

  clear() {
    this._data = {};
    this.saveData();
    return;
  }

}

export default SimpleStorage;
