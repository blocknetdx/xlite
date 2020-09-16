/*global describe,it,beforeEach*/
/*eslint quotes: 0, key-spacing: 0*/
import should from 'should';
import {Map as IMap} from 'immutable';

import Api from '../src/server/modules/api';
import {sanitize, sanitizeObj, Blacklist, Whitelist} from '../src/app/modules/api-r';
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
    Whitelist.should.be.an.Array();
    Blacklist.should.be.an.Array();
  });
  it('sanitize()', function() {
    const test = {
      _one: [{one_one: '_one_one_value'}],
      two: 'two_value',
      _three: {three_three: '_three_three_value'},
      four: true,
      five: {five_five: {_ok: false, ok: [{_no: false, yes: true}, {_no2: false, yes2: true}]}},
    };
    const expected = {two: 'two_value', five: {five_five: {ok: [{yes: true}, {yes2: true}]}}};
    sanitize(test, Blacklist.concat(['four']), Whitelist).should.be.eql(expected);
  });
  it('sanitizeObj()', function() {
    const test = {
      _one: [{one_one: '_one_one_value'}],
      two: 'two_value',
      _three: {three_three: '_three_three_value'},
      four: true,
      five: {five_five: {_ok: false, ok: [{_no: false, yes: true}, {_no2: false, yes2: true}]}},
    };
    const expected = {two: 'two_value', five: {five_five: {ok: [{yes: true}, {yes2: true}]}}};
    sanitizeObj(test, new Set(Blacklist.concat(['four'])), new Set(Whitelist));
    test.should.be.eql(expected);
  });
  it('sanitizeObj() with Map', function() {
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
    sanitizeObj(test, new Set(Blacklist), new Set(Whitelist.concat(['_four'])));
    test.should.be.eql(expected);
  });
  it('sanitizeObj() with IMap', function() {
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
    sanitizeObj(test, new Set(Blacklist), new Set(Whitelist.concat(['_four'])));
    test.should.be.eql(expected);
  });
  it('sanitizeObj() with Set', function() {
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
    sanitizeObj(test, new Set(Blacklist), new Set(Whitelist.concat(['_four'])));
    test.should.be.eql(expected);
  });
});
