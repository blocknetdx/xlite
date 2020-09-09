/*global describe,it,beforeEach*/
/*eslint quotes: 0, key-spacing: 0*/
import should from 'should';
import {Map as IMap} from 'immutable';

import Api from '../src/server/modules/api';
import SimpleStorage from '../src/server/modules/storage';

describe('Api Test Suite', function() {
  let storage;
  let app;
  let proc;
  beforeEach(function() {
    storage = new SimpleStorage();
    app = {quit: () => {}};
    proc = {on: () => {}, handle: () => {}};
  });
  it('Api()', function() {
    const err = {some: 'error'};
    const cloudChains = {'cc': true};
    const confController = {'c': true};
    const walletController = {'w': true};
    const zoomController = {'z': true};
    const api = new Api(storage, app, proc, err, cloudChains, confController, walletController, zoomController);
    api._storage.should.be.instanceof(SimpleStorage);
    api._app.quit.should.be.a.Function();
    api._proc.on.should.be.a.Function();
    api._proc.handle.should.be.a.Function();
    api._err.should.be.eql(err);
    api._cloudChains.should.be.eql(cloudChains);
    api._confController.should.be.eql(confController);
    api._walletController.should.be.eql(walletController);
    api._zoomController.should.be.eql(zoomController);
    api._whitelist.should.be.an.Array();
    api._blacklist.should.be.an.Array();
  });
  it('Api.sanitize()', function() {
    const api = new Api(storage, app, proc, null);
    const test = {
      _one: [{one_one: '_one_one_value'}],
      two: 'two_value',
      _three: {three_three: '_three_three_value'},
      four: true,
      five: {five_five: {_ok: false, ok: [{_no: false, yes: true}, {_no2: false, yes2: true}]}},
    };
    const expected = {two: 'two_value', five: {five_five: {ok: [{yes: true}, {yes2: true}]}}};
    api.sanitize(test, api._blacklist.concat(['four']), api._whitelist).should.be.eql(expected);
  });
  it('Api.sanitizeObj()', function() {
    const api = new Api(storage, app, proc, null);
    const test = {
      _one: [{one_one: '_one_one_value'}],
      two: 'two_value',
      _three: {three_three: '_three_three_value'},
      four: true,
      five: {five_five: {_ok: false, ok: [{_no: false, yes: true}, {_no2: false, yes2: true}]}},
    };
    const expected = {two: 'two_value', five: {five_five: {ok: [{yes: true}, {yes2: true}]}}};
    api.sanitizeObj(test, new Set(api._blacklist.concat(['four'])), new Set(api._whitelist));
    test.should.be.eql(expected);
  });
  it('Api.sanitizeObj() with Map', function() {
    const api = new Api(storage, app, proc, null);
    const test = {
      _one: [{one_one: '_one_one_value'}],
      two: new Map([['twoKEY1', {_no: false, yes: true}], ['twoKEY2', 'twoVALUE2']]),
      _three: new Map([['_threeKEY1', '_threeVALUE1'], ['_threeKEY2', '_threeVALUE2']]),
      _four: new Map([['four', 'four_value']]),
    };
    const expected = {
      two: new Map([['twoKEY1', {yes: true}], ['twoKEY2', 'twoVALUE2']]),
      _four: new Map([['four', 'four_value']]),
    };
    api.sanitizeObj(test, new Set(api._blacklist), new Set(api._whitelist.concat(['_four'])));
    test.should.be.eql(expected);
  });
  it('Api.sanitizeObj() with IMap', function() {
    const api = new Api(storage, app, proc, null);
    const test = {
      _one: [{one_one: '_one_one_value'}],
      two: new IMap([['twoKEY1', {_no: false, yes: true}], ['twoKEY2', 'twoVALUE2']]),
      _three: new IMap([['_threeKEY1', '_threeVALUE1'], ['_threeKEY2', '_threeVALUE2']]),
      _four: new IMap([['four', 'four_value']]),
    };
    const expected = {
      two: new IMap([['twoKEY1', {yes: true}], ['twoKEY2', 'twoVALUE2']]),
      _four: new IMap([['four', 'four_value']]),
    };
    api.sanitizeObj(test, new Set(api._blacklist), new Set(api._whitelist.concat(['_four'])));
    test.should.be.eql(expected);
  });
  it('Api.sanitizeObj() with Set', function() {
    const api = new Api(storage, app, proc, null);
    const test = {
      _one: [{one_one: '_one_one_value'}],
      two: new Set(['one', 'two', 'three']),
      _three: new Set(['three_one', 'three_two', 'three_three']),
      _four: null,
    };
    const expected = {
      two: new Set(['one', 'two', 'three']),
      _four: null,
    };
    api.sanitizeObj(test, new Set(api._blacklist), new Set(api._whitelist.concat(['_four'])));
    test.should.be.eql(expected);
  });
});
