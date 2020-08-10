import 'should';
import ConfController from '../src/app/modules/conf-controller';
import domStorage from '../src/app/modules/dom-storage';
import {localStorageKeys} from '../src/app/constants';

describe('ConfController Test Suite', function() {
  beforeEach(function() {
    domStorage.clear();
  });

  it('ConfController.getManifest()', function() {
    domStorage.setItem(localStorageKeys.MANIFEST, '{"manifest_should_exist": true}');
    const confController = new ConfController(domStorage);
    confController.getManifest().should.equal('{"manifest_should_exist": true}');
  });
  it('ConfController.getManifestHash()', function() {
    domStorage.setItem(localStorageKeys.MANIFEST_SHA, '0123456789');
    const confController = new ConfController(domStorage);
    confController.getManifestHash().should.equal('0123456789');
  });
  it('ConfController.needsUpdate() with stale manifest should not match', async function() {
    const confController = new ConfController(domStorage);
    await confController.needsUpdate(async () => { return {headers: {'x-amz-meta-x-manifest-hash': '0123456789'}}; }).should.be.finally.true();
  });
  it('ConfController.needsUpdate() with recent manifest should match', async function() {
    domStorage.setItem(localStorageKeys.MANIFEST_SHA, '0123456789');
    const confController = new ConfController(domStorage);
    await confController.needsUpdate(async () => { return {headers: {'x-amz-meta-x-manifest-hash': '0123456789'}}; }).should.be.finally.false();
  });
  it('ConfController.fetchManifestHash() should match', async function() {
    const confController = new ConfController(domStorage);
    await confController.fetchManifestHash(async () => { return {headers: {'x-amz-meta-x-manifest-hash': '0123456789'}}; }).should.be.finally.equal('0123456789');
  });
  it('ConfController.fetchManifestHash() bad request should be empty', async function() {
    const confController = new ConfController(domStorage);
    await confController.fetchManifestHash(async () => { return {}; }).should.be.finally.equal('');
  });
  it('ConfController.updateLatest() should pass on valid input', async function() {
    const req = async (url) => {
      if (url === 'manifest-url') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '{"manifest-latest.json":["b705da5df7d83ba3de48eb20fdc3cbf519ef6cc7","manifest-latest.json"]}';
        };
        return o;
      } else if (url === 'manifest-latest.json') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[{"blockchain":"Blocknet","ticker":"BLOCK","ver_id":"blocknet--v4.0.1","ver_name":"Blocknetv4","conf_name":"blocknet.conf","dir_name_linux":"blocknet","dir_name_mac":"Blocknet","dir_name_win":"Blocknet","repo_url":"https://github.com/blocknetdx/blocknet","versions":["v4.3.0"],"xbridge_conf":"blocknet--v4.0.1.conf","wallet_conf":"blocknet--v4.0.1.conf"},{"blockchain":"Bitcoin","ticker":"BTC","ver_id":"bitcoin--v0.15.1","ver_name":"Bitcoinv0.15.x","conf_name":"bitcoin.conf","dir_name_linux":"bitcoin","dir_name_mac":"Bitcoin","dir_name_win":"Bitcoin","repo_url":"https://github.com/bitcoin/bitcoin","versions":["v0.15.1","v0.15.2"],"xbridge_conf":"bitcoin--v0.15.1.conf","wallet_conf":"bitcoin--v0.15.1.conf"}]';
        };
        return o;
      }
    };
    const confController = new ConfController(domStorage);
    await confController.updateLatest('manifest-url', '0123456789', 'manifest-latest.json', req).should.be.finally.true();
    domStorage.getItem(localStorageKeys.MANIFEST_SHA).should.be.equal('0123456789');
    const res = await req('manifest-latest.json');
    domStorage.getItem(localStorageKeys.MANIFEST).should.be.deepEqual(JSON.parse(res.body.toString()));
  });
  it('ConfController.updateLatest() should fail on bad manifest url', async function() {
    // return bad json here
    const req = async (url) => { return ''; };
    const confController = new ConfController(domStorage);
    await confController.updateLatest('manifest-url', '0123456789', 'manifest-latest.json', req).should.be.finally.false();
  });
  it('ConfController.updateLatest() should fail on bad manifest hash file', async function() {
    // return bad json here (manifest-latest.json => manifest-.json)
    const req = async (url) => {
      if (url === 'manifest-url') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '{"manifest-.json":["b705da5df7d83ba3de48eb20fdc3cbf519ef6cc7","manifest-latest.json"]}';
        };
        return o;
      }
      return '';
    };
    const confController = new ConfController(domStorage);
    await confController.updateLatest('manifest-url', '0123456789', 'manifest-latest.json', req).should.be.finally.false();
  });
});
