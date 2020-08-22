import 'should';
import ConfController from '../src/app/modules/conf-controller';
import domStorage from '../src/app/modules/dom-storage';
import {localStorageKeys} from '../src/app/constants';
import XBridgeInfo from '../src/app/types/xbridgeinfo';
import Token from '../src/app/types/token';

describe('ConfController Test Suite', function() {
  beforeEach(function() {
    domStorage.clear();
  });

  const availableWallets = ['BLOCK', 'BTC'];
  it('ConfController.getManifest()', function() {
    const data = [{'manifest_should_exist': true}];
    domStorage.setItem(localStorageKeys.MANIFEST, data);
    const confController = new ConfController(domStorage, availableWallets);
    confController.getManifest().should.eql(data);
  });
  it('ConfController.getManifest() with bad data should return empty []', function() {
    domStorage.setItem(localStorageKeys.MANIFEST, '{"manifest_should_exist": true}');
    const confController = new ConfController(domStorage, availableWallets);
    confController.getManifest().should.eql([]);
  });
  it('ConfController.getManifestHash()', function() {
    domStorage.setItem(localStorageKeys.MANIFEST_SHA, '0123456789');
    const confController = new ConfController(domStorage, availableWallets);
    confController.getManifestHash().should.equal('0123456789');
  });
  it('ConfController.getFeeInfo()', function() {
    const feeBLOCK = new XBridgeInfo({ ticker: 'BLOCK', feeperbyte: 20, mintxfee: 10000, coin: 100000000 });
    const feeBTC = new XBridgeInfo({ ticker: 'BTC', feeperbyte: 120, mintxfee: 7500, coin: 100000000 });
    domStorage.setItem(localStorageKeys.XBRIDGE_INFO, [feeBLOCK, feeBTC]);
    const confController = new ConfController(domStorage, availableWallets);
    confController.getXBridgeInfo()[0].should.be.instanceof(XBridgeInfo);
    confController.getXBridgeInfo().should.eql([feeBLOCK, feeBTC]);
  });
  it('ConfController.needsUpdate() with stale manifest should not match', async function() {
    const confController = new ConfController(domStorage, availableWallets);
    await confController.needsUpdate(async () => { return {headers: {'x-amz-meta-x-manifest-hash': '0123456789'}}; }).should.be.finally.true();
  });
  it('ConfController.needsUpdate() with recent manifest should match', async function() {
    domStorage.setItem(localStorageKeys.MANIFEST_SHA, '0123456789');
    const confController = new ConfController(domStorage, availableWallets);
    await confController.needsUpdate(async () => { return {headers: {'x-amz-meta-x-manifest-hash': '0123456789'}}; }).should.be.finally.false();
  });
  it('ConfController.fetchManifestHash() should match', async function() {
    const confController = new ConfController(domStorage, availableWallets);
    await confController.fetchManifestHash(async () => { return {headers: {'x-amz-meta-x-manifest-hash': '0123456789'}}; }).should.be.finally.equal('0123456789');
  });
  it('ConfController.fetchManifestHash() bad request should be empty', async function() {
    const confController = new ConfController(domStorage, availableWallets);
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
      } else if (url === 'xbridge-confs/blocknet--v4.0.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BLOCK]\\nTitle=Blocknet\\nAddress=\\nIp=127.0.0.1\\nPort=41414\\nUsername=\\nPassword=\\nAddressPrefix=26\\nScriptPrefix=28\\nSecretPrefix=154\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=1\\nDustAmount=0\\nCreateTxMethod=BTC\\nGetNewKeySupported=true\\nImportWithNoScanSupported=true\\nMinTxFee=10000\\nBlockTime=60\\nFeePerByte=20\\nConfirmations=0';
        };
        return o;
      } else if (url === 'xbridge-confs/bitcoin--v0.15.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BTC]\\nTitle=Bitcoin\\nAddress=\\nIp=127.0.0.1\\nPort=8332\\nUsername=\\nPassword=\\nAddressPrefix=0\\nScriptPrefix=5\\nSecretPrefix=128\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=2\\nDustAmount=0\\nCreateTxMethod=BTC\\nMinTxFee=7500\\nBlockTime=600\\nGetNewKeySupported=false\\nImportWithNoScanSupported=false\\nFeePerByte=120\\nConfirmations=1';
        };
        return o;
      }
    };
    const sortFn = (a,b) => a.ticker.localeCompare(b.ticker);
    const confController = new ConfController(domStorage, availableWallets);
    await confController.updateLatest('manifest-url', 'xbridge-confs/', '0123456789', 'manifest-latest.json', req).should.be.finally.true();
    domStorage.getItem(localStorageKeys.MANIFEST_SHA).should.be.equal('0123456789');
    const res = await req('manifest-latest.json');
    domStorage.getItem(localStorageKeys.MANIFEST).sort(sortFn).should.be.deepEqual(JSON.parse(res.body.toString()).sort(sortFn));
    confController.getXBridgeInfo().length.should.be.equal(2);
    const feeBLOCK = new XBridgeInfo({ ticker: 'BLOCK', feeperbyte: 20, mintxfee: 10000, coin: 100000000, rpcport: 41414 });
    const feeBTC = new XBridgeInfo({ ticker: 'BTC', feeperbyte: 120, mintxfee: 7500, coin: 100000000, rpcport: 8332 });
    confController.getXBridgeInfo().sort(sortFn).should.be.eql([feeBLOCK, feeBTC].sort(sortFn));
  });
  it('ConfController.updateLatest() should filter out old configs', async function() {
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
          return '[{"blockchain":"Blocknet","ticker":"BLOCK","ver_id":"blocknet--v4.0.1","ver_name":"Blocknetv4","conf_name":"blocknet.conf","dir_name_linux":"blocknet","dir_name_mac":"Blocknet","dir_name_win":"Blocknet","repo_url":"https://github.com/blocknetdx/blocknet","versions":["v4.3.0"],"xbridge_conf":"blocknet--v4.0.1.conf","wallet_conf":"blocknet--v4.0.1.conf"},{"blockchain":"Bitcoin","ticker":"BTC","ver_id":"bitcoin--v0.100.1","ver_name":"Bitcoinv0.15.x","conf_name":"bitcoin.conf","dir_name_linux":"bitcoin","dir_name_mac":"Bitcoin","dir_name_win":"Bitcoin","repo_url":"https://github.com/bitcoin/bitcoin","versions":["v0.100.1","v0.20.2"],"xbridge_conf":"bitcoin--v0.100.1.conf","wallet_conf":"bitcoin--v0.100.1.conf"},{"blockchain":"Bitcoin","ticker":"BTC","ver_id":"bitcoin--v0.15.1","ver_name":"Bitcoinv0.15.x","conf_name":"bitcoin.conf","dir_name_linux":"bitcoin","dir_name_mac":"Bitcoin","dir_name_win":"Bitcoin","repo_url":"https://github.com/bitcoin/bitcoin","versions":["v0.15.1","v0.15.2"],"xbridge_conf":"bitcoin--v0.15.1.conf","wallet_conf":"bitcoin--v0.15.1.conf"},{"blockchain":"Bitcoin","ticker":"BTC","ver_id":"bitcoin--v0.20.1","ver_name":"Bitcoinv0.15.x","conf_name":"bitcoin.conf","dir_name_linux":"bitcoin","dir_name_mac":"Bitcoin","dir_name_win":"Bitcoin","repo_url":"https://github.com/bitcoin/bitcoin","versions":["v0.20.1","v0.20.2"],"xbridge_conf":"bitcoin--v0.20.1.conf","wallet_conf":"bitcoin--v0.20.1.conf"}]';
        };
        return o;
      } else if (url === 'xbridge-confs/blocknet--v4.0.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BLOCK]\\nTitle=Blocknet\\nAddress=\\nIp=127.0.0.1\\nPort=41414\\nUsername=\\nPassword=\\nAddressPrefix=26\\nScriptPrefix=28\\nSecretPrefix=154\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=1\\nDustAmount=0\\nCreateTxMethod=BTC\\nGetNewKeySupported=true\\nImportWithNoScanSupported=true\\nMinTxFee=10000\\nBlockTime=60\\nFeePerByte=20\\nConfirmations=0';
        };
        return o;
      } else if (url === 'xbridge-confs/bitcoin--v0.15.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BTC]\\nTitle=Bitcoin\\nAddress=\\nIp=127.0.0.1\\nPort=8332\\nUsername=\\nPassword=\\nAddressPrefix=0\\nScriptPrefix=5\\nSecretPrefix=128\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=2\\nDustAmount=0\\nCreateTxMethod=BTC\\nMinTxFee=7500\\nBlockTime=600\\nGetNewKeySupported=false\\nImportWithNoScanSupported=false\\nFeePerByte=120\\nConfirmations=1';
        };
        return o;
      } else if (url === 'xbridge-confs/bitcoin--v0.20.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BTC]\\nTitle=Bitcoin\\nAddress=\\nIp=127.0.0.1\\nPort=8332\\nUsername=\\nPassword=\\nAddressPrefix=0\\nScriptPrefix=5\\nSecretPrefix=128\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=2\\nDustAmount=0\\nCreateTxMethod=BTC\\nMinTxFee=7500\\nBlockTime=600\\nGetNewKeySupported=false\\nImportWithNoScanSupported=false\\nFeePerByte=120\\nConfirmations=1';
        };
        return o;
      } else if (url === 'xbridge-confs/bitcoin--v0.100.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BTC]\\nTitle=Bitcoin\\nAddress=\\nIp=127.0.0.1\\nPort=8332\\nUsername=\\nPassword=\\nAddressPrefix=0\\nScriptPrefix=5\\nSecretPrefix=128\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=2\\nDustAmount=0\\nCreateTxMethod=BTC\\nMinTxFee=7500\\nBlockTime=600\\nGetNewKeySupported=false\\nImportWithNoScanSupported=false\\nFeePerByte=120\\nConfirmations=1';
        };
        return o;
      }
    };
    const confController = new ConfController(domStorage, availableWallets);
    await confController.updateLatest('manifest-url', 'xbridge-confs/', '0123456789', 'manifest-latest.json', req).should.be.finally.true();
    const manifest = confController.getManifest();
    for (const t of manifest) {
      const token = new Token(t);
      if (token.ticker === 'BTC')
        token.xbridge_conf.should.be.equal('bitcoin--v0.100.1.conf');
    }
  });
  it('ConfController.updateLatest() should fail on bad xbridge info', async function() {
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
      } else if (url === 'xbridge-confs/blocknet--v4.0.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '';
        };
        return o;
      } else if (url === 'xbridge-confs/bitcoin--v0.15.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BTC]\\nTitle=Bitcoin\\nAddress=\\nIp=127.0.0.1\\nPort=8332\\nUsername=\\nPassword=\\nAddressPrefix=0\\nScriptPrefix=5\\nSecretPrefix=128\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=2\\nDustAmount=0\\nCreateTxMethod=BTC\\nMinTxFee=7500\\nBlockTime=600\\nGetNewKeySupported=false\\nImportWithNoScanSupported=false\\nFeePerByte=120\\nConfirmations=1';
        };
        return o;
      }
    };
    const confController = new ConfController(domStorage, availableWallets);
    await confController.updateLatest('manifest-url', 'xbridge-confs/', '0123456789', 'manifest-latest.json', req).should.be.finally.false();
    confController.getXBridgeInfo().length.should.equal(0);
  });
  it('ConfController.updateLatest() should fail on missing port info', async function() {
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
      } else if (url === 'xbridge-confs/blocknet--v4.0.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BLOCK]\\nTitle=Blocknet\\nAddress=\\nIp=127.0.0.1\\nPort=41414\\nUsername=\\nPassword=\\nAddressPrefix=26\\nScriptPrefix=28\\nSecretPrefix=154\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=1\\nDustAmount=0\\nCreateTxMethod=BTC\\nGetNewKeySupported=true\\nImportWithNoScanSupported=true\\nMinTxFee=10000\\nBlockTime=60\\nFeePerByte=20\\nConfirmations=0';
        };
        return o;
      } else if (url === 'xbridge-confs/bitcoin--v0.15.1.conf') {
        let o = {};
        o.body = {};
        o.body.toString = () => {
          return '[BTC]\\nTitle=Bitcoin\\nAddress=\\nIp=127.0.0.1\\nPort=\\nUsername=\\nPassword=\\nAddressPrefix=0\\nScriptPrefix=5\\nSecretPrefix=128\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=2\\nDustAmount=0\\nCreateTxMethod=BTC\\nMinTxFee=7500\\nBlockTime=600\\nGetNewKeySupported=false\\nImportWithNoScanSupported=false\\nFeePerByte=120\\nConfirmations=1';
        };
        return o;
      }
    };
    const confController = new ConfController(domStorage, availableWallets);
    await confController.updateLatest('manifest-url', 'xbridge-confs/', '0123456789', 'manifest-latest.json', req).should.be.finally.false();
    confController.getXBridgeInfo().length.should.equal(0);
  });
  it('ConfController.updateLatest() should fail on bad manifest url', async function() {
    // return bad json here
    const req = async (url) => { return ''; };
    const confController = new ConfController(domStorage, availableWallets);
    await confController.updateLatest('manifest-url', 'xbridge-confs/', '0123456789', 'manifest-latest.json', req).should.be.finally.false();
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
    const confController = new ConfController(domStorage, availableWallets);
    await confController.updateLatest('manifest-url', 'xbridge-confs/', '0123456789', 'manifest-latest.json', req).should.be.finally.false();
  });
});
