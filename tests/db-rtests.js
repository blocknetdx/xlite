/* global after, before, describe, it, should */

import should from 'should';
import Dexie from 'dexie';
import * as uuid from 'uuid';
import { DBTable, DBQuery, db, TableConfig, DB } from '../src/app/modules/db';

class TestInitializer {
  constructor(data) {
    Object.assign(this, data);
  }
}

describe('DB Test Suite', function() {

  const dbName = 'TEST_DB';
  const dbVersion = 1;
  const tableName0 = 'TEST_TABLE_0';
  const tableName1 = 'TEST_TABLE_1';
  const tableConfig0 = new TableConfig(tableName0, ['_id', 'name', 'date', 'age'], TestInitializer);
  const tableConfig1 = new TableConfig(tableName1,['_id', 'name', 'date', 'age']);
  const tableConfigs = [
    tableConfig0,
    tableConfig1
  ];

  describe('DB', function() {

    it('DB.initialize() should initialize the database', async function() {
      db.should.be.an.instanceOf(DB);
      db.initialize.should.be.a.Function();
      await db.initialize(dbName, dbVersion, tableConfigs);
      db._db.should.be.an.instanceOf(Dexie);
    });

    it('DB.table() should return a DBTable instance', async function() {
      db.table.should.be.a.Function();
      db.table(tableName0).should.be.an.instanceOf(DBTable);
    });

  });

  describe('DBTable', function() {

    it('DBTable._db should be the full database instance', function() {
      const table0 = db.table(tableName0);
      table0._db.should.equal(db);
    });

    it('DBTable._Initializer should be an optional constructor function', function() {
      // first table has an initializer
      const table0 = db.table(tableName0);
      table0._Initializer.should.equal(TestInitializer);
      // second table does not have an initializer
      const table1 = db.table(tableName1);
      should(table1._Initializer).be.null();
    });

    it('DBTable._name should be the table name', function() {
      const table0 = db.table(tableName0);
      table0._name.should.be.a.String();
      table0._name.should.equal(tableName0);
    });

    it('DBTable._table should be a Dexie Table instance', function() {
      const table0 = db.table(tableName0);
      // I cannot find an export of Dexie's Table class to check so I just check that it is an object
      table0._table.should.be.an.Object();
    });

    const doc0 = {
      name: 'Tom',
      age: 24
    };
    const doc1 = {
      name: 'Sam',
      age: 24
    };
    let dbDoc0, dbDoc1;

    it('DBTable.insert() inserts a document and returns the new document', async function() {
      dbDoc0 = await db
        .table(tableName0)
        .insert(doc0);
      dbDoc0.should.be.an.instanceOf(TestInitializer);
      dbDoc0._id.should.be.a.String();
      dbDoc1 = await db
        .table(tableName0)
        .insert(doc1);
      dbDoc1.should.be.an.instanceOf(TestInitializer);
      dbDoc1._id.should.be.a.String();
    });

    it('DBTable.find() finds matching documents based on indexed properties', async function() {
      // No parameters returns all table items
      const res0 = await db
        .table(tableName0)
        .find();
      res0.should.be.an.Array();
      [dbDoc0._id, dbDoc1._id].every(_id => res0.some(i => i._id === _id)).should.be.true();
      // If object passed in, returns all docs that match
      const res1 = await db
        .table(tableName0)
        .find({name: 'Sam'});
      res1.should.be.an.Array();
      res1.some(i => i._id === dbDoc1._id).should.be.true();
      // No matching docs returns an empty array
      const res2 = await db
        .table(tableName0)
        .find({name: uuid.v4()});
      res2.should.be.an.Array();
      res2.length.should.equal(0);
    });

    it('DBTable.query() should return a query type', async function() {
      const res = db
        .table(tableName0)
        .query('something');
      res.should.be.an.instanceOf(DBQuery);
    });

    it('DBTable.findOne() finds a single document based on indexed properties', async function() {
      const res0 = await db
        .table(tableName0)
        .findOne({age: 24});
      res0.should.be.an.Object();
      const res1 = await db
        .table(tableName0)
        .findOne({name: uuid.v4()});
      should(res1).be.undefined();
    });

    it('DBTable.batchGet() gets items based on an array of _ids', async function() {
      const res0 = await db
        .table(tableName0)
        .batchGet([dbDoc0._id, dbDoc1._id]);
      res0.should.be.an.Array();
      res0.every(i => i.should.be.an.instanceOf(TestInitializer));
    });

    it('DBTable.put() replaces or inserts a document by _id and returns the new document', async function() {
      const newDoc0 = {
        ...dbDoc0,
        name: 'Tommy'
      };
      // newDoc0 contains an _id already in the db so the document is replaced
      const res0 = await db
        .table(tableName0)
        .put(newDoc0);
      res0.should.be.an.instanceOf(TestInitializer);
      res0.name.should.equal(newDoc0.name);
      res0._id.should.equal(dbDoc0._id);
      // the following isn't in the db so the document is added
      const newName = 'Dorothy';
      const res1 = await db
        .table(tableName0)
        .put({
          name: newName
        });
      res1.should.be.an.instanceOf(TestInitializer);
      res1.name.should.equal(newName);
      res1._id.should.be.a.String();
    });

    it('DBTable.upate() updates a record based on the _id and returns the updated document', async function() {
      const newName = 'Thomas';
      const [ res0 ] = await db
        .table(tableName0)
        .update({_id: dbDoc0._id}, {
          name: newName
        });
      res0.name.should.equal(newName);
    });

    it('DBTable.remove() removes one or more records based on indexed properties and returns the number of documents removed', async function() {
      const res = await db
        .table(tableName0)
        .remove({age: 24});
      res.should.equal(2);
      const found = await db
        .table(tableName0)
        .find({age: 24});
      found.length.should.equal(0);
    });

    it('DBTable.clear() clears all items from the table', async function() {
      await db.table(tableName0).clear();
      await db.table(tableName1).clear();
      const res0 = await db.table(tableName0).find();
      res0.length.should.equal(0);
      const res1 = await db.table(tableName0).find();
      res1.length.should.equal(0);
    });

  });

  describe('DBQuery', function() {

    before(async function() {
      const table = db.table(tableName0);
      await table.insert({
        name: 'Tom',
        age: 24
      });
      await table.insert({
        name: 'Dorothy',
        age: 46
      });
      await table.insert({
        name: 'Ashley',
        age: 32
      });
      await table.insert({
        name: 'Sam',
        age: 32
      });
    });

    it('DBQuery.equals()', async function() {
      const name = 'Dorothy';
      const res = await db
        .table(tableName0)
        .query('name')
        .equals(name)
        .exec();
      res.should.be.an.Array();
      // console.log(res);
      res.length.should.be.greaterThan(0);
      res.every(i => i.should.be.an.instanceOf(TestInitializer));
      res.every(i => i.name.should.equal(name));
    });

    it('DBQuery.notEquals()', async function() {
      const name = 'Dorothy';
      const res = await db
        .table(tableName0)
        .query('name')
        .notEquals(name)
        .exec();
      res.should.be.an.Array();
      res.length.should.be.greaterThan(0);
      res.every(i => i.should.be.an.instanceOf(TestInitializer));
      res.every(i => i.name.should.not.equal(name));
    });

    it('DBQuery.greaterThan()', async function() {
      const age = 30;
      const res = await db
        .table(tableName0)
        .query('age')
        .greaterThan(age)
        .exec();
      res.should.be.an.Array();
      res.length.should.be.greaterThan(0);
      res.every(i => i.should.be.an.instanceOf(TestInitializer));
      res.every(i => i.age.should.be.greaterThan(age));
    });

    it('DBQuery.lessThan()', async function() {
      const age = 30;
      const res = await db
        .table(tableName0)
        .query('age')
        .lessThan(age)
        .exec();
      res.should.be.an.Array();
      res.length.should.be.greaterThan(0);
      res.every(i => i.should.be.an.instanceOf(TestInitializer));
      res.every(i => i.age.should.be.lessThan(age));
    });

    it('DBQuery.sort()', async function() {
      { // ascending
        const age = 32;
        const res = await db
          .table(tableName0)
          .query('age')
          .equals(age)
          .sort('name', -1)
          .exec();
        // console.log(res);
        res.should.be.an.Array();
        res.length.should.be.greaterThan(0);
        res.every(i => i.should.be.an.instanceOf(TestInitializer));
        res[0].name.localeCompare(res[1].name).should.equal(-1);
      }
      { // descending
        const age = 32;
        const res = await db
          .table(tableName0)
          .query('age')
          .equals(age)
          .sort('name', 1)
          .exec();
        res.should.be.an.Array();
        res.length.should.be.greaterThan(0);
        res.every(i => i.should.be.an.instanceOf(TestInitializer));
        res[0].name.localeCompare(res[1].name).should.equal(1);
      }
    });

    it('DBQuery.limit()', async function() {
      const age = 32;
      const limit = 1;
      const res = await db
        .table(tableName0)
        .query('age')
        .equals(age)
        .limit(limit)
        .exec();
      res.should.be.an.Array();
      res.length.should.equal(limit);
      res.every(i => i.should.be.an.instanceOf(TestInitializer));
    });

    it('DBQuery.offset()', async function() {
      const age = 32;
      const resNoOffsetOrLimit = await db
        .table(tableName0)
        .query('age')
        .equals(age)
        .exec();
      const resWithOffset = await db
        .table(tableName0)
        .query('age')
        .equals(age)
        .limit(1)
        .offset(1)
        .exec();
      resWithOffset.should.be.an.Array();
      resWithOffset[0].name.should.equal(resNoOffsetOrLimit[1].name);
      resWithOffset.every(i => i.should.be.an.instanceOf(TestInitializer));
    });

    after(async function() {
      await db.table(tableName0).clear();
    });

  });

});
