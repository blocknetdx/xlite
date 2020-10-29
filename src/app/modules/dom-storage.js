// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * Class for accessing localStorage
 */
class DOMStorage {

  constructor() { }

  /**
   * @param value {any}
   * @returns {string}
   * @private
   */
  _serialize(value) {
    if (value instanceof Map)
      return JSON.stringify(Array.from(value));
    return JSON.stringify(value);
  }

  /**
   * @param json {string}
   * @returns {null|any}
   * @private
   */
  _deserialize(json) {
    try {
      const data = JSON.parse(json);
      return data;
    } catch(err) {
      return null;
    }
  }

  /**
   * Gets an item from localStorage
   * @param key {string}
   * @returns {any | null}
   */
  getItem(key) {
    return this._deserialize(localStorage.getItem(key));
  }

  /**
   * Sets an item to localStorage
   * @param key {string}
   * @param value {any}
   * @returns {undefined}
   */
  setItem(key, value) {
    return localStorage.setItem(key, this._serialize(value));
  }

  /**
   * Sets multiple items to localStorage
   * @param items {Object[]}
   */
  setItems(items = {}) {
    for(const key of Object.keys(items)) {
      this.setItem(key, items[key]);
    }
  }

  /**
   * Removes an item from localStorage
   * @param key {string}
   */
  removeItem(key) {
    localStorage.removeItem(key);
  }

  /**
   * Removed multiple items from localStorage
   * @param keys {string[]}
   */
  removeItems(keys = []) {
    keys.forEach(this.removeItem);
  }

  /**
   * Clears all items from localStorate
   * @returns {undefined}
   */
  clear() {
    localStorage.clear();
  }

}

const domStorage = new DOMStorage();

export default domStorage;
