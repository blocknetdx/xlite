import Dexie from 'dexie';
import * as uuid from 'uuid';

export class TableConfig {

  /**
   * @type {string}
   */
  tableName = '';

  /**
   * @type {string[]}
   */
  indexes = [];

  /**
   * @type {Constructor}
   */
  Initializer = null;

  /**
   * @param tableName {string}
   * @param indexes {string[]}
   * @param Initializer {Constructor}
   */
  constructor(tableName = '', indexes = [], Initializer) {
    this.tableName = tableName;
    this.indexes = indexes;
    this.Initializer = Initializer;
  }
}

export class DBQuery {

  /**
   * @type {number}
   */
  static SORT_ASCENDING = -1;

  /**
   * @type {number}
   */
  static SORT_DESCENDING = 1;

  /**
   * @type {{EQUALS: string, NOT_EQUALS: string, GREATER_THAN: string, LESS_THAN: string}}
   */
  static queryTypes = {
    EQUALS: 'EQUALS',
    NOT_EQUALS: 'NOT_EQUALS',
    GREATER_THAN: 'GREATER_THAN',
    LESS_THAN: 'LESS_THAN'
  };

  /**
   * @type {Object} Dexie Table https://dexie.org/docs/Table/Table
   * @private
   */
  _table = null;

  /**
   * @type {Constructor}
   * @private
   */
  _Initializer = null;

  /**
   * @type {string}
   * @private
   */
  _property = '';

  /**
   * @type {string|number|boolean}
   * @private
   */
  _value = '';

  /**
   * @type {string}
   * @private
   */
  _queryType = '';

  /**
   * @type {string}
   * @private
   */
  _sortBy = '';

  /**
   * @type {number}
   * @private
   */
  _sortDirection = DBQuery.SORT_ASCENDING;

  /**
   * @type {number}
   * @private
   */
  _limit = 0;

  /**
   * @type {number}
   * @private
   */
  _offset = 0;

  /**
   * @param table {Object}
   * @param initializer {Constructor}
   * @param property {string}
   */
  constructor(table, Initializer, property) {
    this._table = table;
    this._Initializer = Initializer;
    this._property = property;
  }

  /**
   * @returns {Promise<*[]>}
   */
  async exec() {
    const {
      _table,
      _property,
      _value,
      _queryType,
      _Initializer,
      _sortBy,
      _sortDirection,
      _limit,
      _offset
    } = this;
    if (!_property || !_queryType)
      return [];
    let items;
    switch(_queryType) {
      case DBQuery.queryTypes.EQUALS: {
        if(_sortBy && _sortDirection === DBQuery.SORT_ASCENDING) {
          items = await _table
            .where(_property)
            .equals(_value)
            .sortBy(_sortBy);
        } else if(_sortBy && _sortDirection === DBQuery.SORT_DESCENDING) {
          items = await _table
            .where(_property)
            .equals(_value)
            .reverse()
            .sortBy(_sortBy);
        } else {
          items = await _table
            .where(_property)
            .equals(_value)
            .toArray();
        }
        break;
      } case DBQuery.queryTypes.NOT_EQUALS: {
        if(_sortBy && _sortDirection === DBQuery.SORT_ASCENDING) {
          items = await _table
            .where(_property)
            .notEqual(_value)
            .sortBy(_sortBy);
        } else if(_sortBy && _sortDirection === DBQuery.SORT_DESCENDING) {
          items = await _table
            .where(_property)
            .notEqual(_value)
            .reverse()
            .sortBy(_sortBy);
        } else {
          items = await _table
            .where(_property)
            .notEqual(_value)
            .toArray();
        }
        break;
      } case DBQuery.queryTypes.GREATER_THAN: {
        if(_sortBy && _sortDirection === DBQuery.SORT_ASCENDING) {
          items = await _table
            .where(_property)
            .above(_value)
            .sortBy(_sortBy);
        } else if(_sortBy && _sortDirection === DBQuery.SORT_DESCENDING) {
          items = await _table
            .where(_property)
            .above(_value)
            .reverse()
            .sortBy(_sortBy);
        } else {
          items = await _table
            .where(_property)
            .above(_value)
            .toArray();
        }
        break;
      } case DBQuery.queryTypes.LESS_THAN: {
        if(_sortBy && _sortDirection === DBQuery.SORT_ASCENDING) {
          items = await _table
            .where(_property)
            .below(_value)
            .sortBy(_sortBy);
        } else if(_sortBy && _sortDirection === DBQuery.SORT_DESCENDING) { // sort descending
          items = await _table
            .where(_property)
            .below(_value)
            .reverse()
            .sortBy(_sortBy);
        } else {
          items = await _table
            .where(_property)
            .below(_value)
            .toArray();
        }
        break;
      } default:
        return [];
    }
    if(_limit && _offset) {
      items = items
        .slice(_offset, _offset + _limit);
    } else if(_limit) {
      items = items
        .slice(0, _limit);
    } else if(_offset) {
      items = items
        .slice(_offset - 1);
    }
    return _Initializer ? items.map(i => new _Initializer(i)) : items;
  }

  /**
   * @param value {string|number|boolean}
   * @returns {DBQuery}
   */
  equals(value) {
    this._queryType = DBQuery.queryTypes.EQUALS;
    this._value = value;
    return this;
  }

  /**
   * @param value {string|number|boolean}
   * @returns {DBQuery}
   */
  notEquals(value) {
    this._queryType = DBQuery.queryTypes.NOT_EQUALS;
    this._value = value;
    return this;
  }

  /**
   * @param value {string|number}
   * @returns {DBQuery}
   */
  greaterThan(value) {
    this._queryType = DBQuery.queryTypes.GREATER_THAN;
    this._value = value;
    return this;
  }

  /**
   * @param value {string|number}
   * @returns {DBQuery}
   */
  lessThan(value) {
    this._queryType = DBQuery.queryTypes.LESS_THAN;
    this._value = value;
    return this;
  }

  /**
   * @param sortBy {string}
   * @param sortDirection {-1|1}
   * @returns {DBQuery}
   */
  sort(sortBy, sortDirection) {
    this._sortBy = sortBy;
    this._sortDirection = sortDirection;
    return this;
  }

  /**
   * @param limit {number}
   * @returns {DBQuery}
   */
  limit(limit) {
    if(limit > -1)
      this._limit = limit;
    return this;
  }

  /**
   * @param offset {number}
   * @returns {DBQuery}
   */
  offset(offset) {
    if(offset > -1)
      this._offset = offset;
    return this;
  }

}

export class DBTable {

  /**
   * @type {DB}
   * @private
   */
  _db = null;

  /**
   * @type {Class}
   * @private
   */
  _Initializer = null;

  /**
   * @type {string}
   * @private
   */
  _name = '';

  /**
   * @type {Object} Dexie Table https://dexie.org/docs/Table/Table
   * @private
   */
  _table = null;

  /**
   * @param table {Object}
   * @param name {string}
   * @param db {DB}
   * @param Initializer {Constructor}
   */
  constructor(table, name, db, Initializer) {
    this._table = table;
    this._name = name;
    this._db = db;
    if(Initializer)
      this._Initializer = Initializer;
  }

  /**
   * @param query {Object}
   * @returns {Promise<*[]>}
   */
  async find(query = {}) {
    const keys = Object.keys(query);
    const { _Initializer } = this;
    let items;
    if(keys.length === 0) {
      items = await this._table
        .toCollection()
        .toArray();
    } else {
      items = await this._table
        .where(query)
        .toArray();
    }
    return _Initializer ? items.map(i => new _Initializer(i)) : items;
  }

  /**
   * @param property {string}
   * @returns {DBQuery}
   */
  query(property) {
    return new DBQuery(this._table, this._Initializer, property);
  }

  /**
   * @param query {Object}
   * @returns {Promise<*[]>}
   */
  async findOne(query = {}) {
    const { _Initializer } = this;
    const res = await this._table
      .where(query)
      .first();
    return res ? new _Initializer(res) : res;
  }

  /**
   * @param ids {string[]}
   * @returns {Promise<*[]>}
   */
  async batchGet(ids = []) {  // return the items sorted in the same order as ids param
    const { _Initializer } = this;
    const idToIdx = ids
      .reduce((obj, _id, idx) => ({
        ...obj,
        [_id]: idx
      }), {});
    const items = await this._table
      .where('_id')
      .anyOf(ids)
      .toArray();

    items.sort((a, b) => {
      const aIdx = idToIdx[a._id];
      const bIdx = idToIdx[b._id];
      return aIdx - bIdx;
    });

    return _Initializer ? items.map(i => new _Initializer(i)) : items;
  }

  /**
   * @param doc {Object}
   * @returns {Promise<*>}
   */
  async insert(doc = {}) {
    const { _Initializer } = this;
    const now = new Date().toISOString();
    const newDoc = {
      _id: doc._id || uuid.v4(),
      createdAt: now,
      updatedAt: now,
      ...doc
    };
    await this._table.add(newDoc);
    return newDoc && _Initializer ? new _Initializer(newDoc) : newDoc;
  }

  /**
   * @param doc {Object}
   * @returns {Promise<*>}
   */
  async put(doc = {}) {
    const { _Initializer } = this;
    const now = new Date().toISOString();
    const newDoc = {
      ...doc,
      _id: doc._id || uuid.v4(),
      createdAt: doc.createdAt || now,
      updatedAt: doc.updatedAt || now
    };
    await this._table.put(newDoc);
    return newDoc && _Initializer ? new _Initializer(newDoc) : newDoc;
  }

  /**
   * @param query {Object}
   * @param changes {Object}
   * @returns {Promise<*[]>}
   */
  async update(query, changes) {
    const now = new Date().toISOString();
    const items = await this.find(query);
    await Promise.all(items.map(({ _id }) => this._table.update(_id, {
      ...changes,
      updatedAt: now
    })));
    const ids = items.map(i => i._id);
    return this.batchGet(ids);
  }

  /**
   * @param query
   * @returns {Promise<number>}
   */
  async remove(query) {
    const res = await this._table
      .where(query)
      .delete();
    return res;
  }

  /**
   * @returns {Promise<void>}
   */
  clear() {
    return this._table.clear();
  }

}

export class DB {

  _db = null;
  _tables = new Map();

  /**
   * @param dbName {string}
   * @param version {number}
   * @param tableConfigs {TableConfig[]}
   */
  initialize(dbName, version, tableConfigs = []) {

    const db = new Dexie(dbName);
    this._db = db;

    const stores = {};
    for(const { tableName, indexes } of tableConfigs) {
      stores[tableName] = indexes.join(',');
    }

    // db version must be incremented up if we ever add new tables or update indexes
    db.version(version).stores(stores);

    for(const { tableName, Initializer } of tableConfigs) {
      this._tables.set(tableName, new DBTable(db[tableName], tableName, this, Initializer));
    }
  }

  /**
   * @param tableName {string}
   * @throws Throws error if unknown table
   * @returns {DBTable}
   */
  table(tableName) {
    if(!this._tables.has(tableName))
      throw new Error(`Unknown table ${tableName}`);
    return this._tables.get(tableName);
  }

}

export const db = new DB();
