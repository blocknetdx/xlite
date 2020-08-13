import 'should';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import CCWalletConf from '../src/app/types/ccwalletconf';
import CloudChains from '../src/app/modules/cloudchains';

describe('CCWalletConf Test Suite', function() {
  const confDataBLOCK = {
    "rpcPassword": "test",
    "fee": 1.0E-4,
    "rpcUsername": "user",
    "rpcPort": 41414,
    "feeFlat": true,
    "rpcEnabled": true,
    "addressCount": 20
  };
  it('CCWalletConf()', function() {
    const ticker = 'BLOCK';
    const confBLOCK = new CCWalletConf(ticker, confDataBLOCK);
    confBLOCK.rpcPassword.should.be.equal('test');
    confBLOCK.fee.should.be.equal(1.0E-4);
    confBLOCK.rpcUsername.should.be.equal('user');
    confBLOCK.rpcPort.should.be.equal(41414);
    confBLOCK.feeFlat.should.be.equal(true);
    confBLOCK.rpcEnabled.should.be.equal(true);
    confBLOCK.addressCount.should.be.equal(20);
    confBLOCK.ticker().should.be.equal(ticker);
  });
});

describe('CloudChains Test Suite', function() {
  const tmp = path.join(os.tmpdir(), 'tests_cloudchains_test_suite');
  before(function() {
    if (fs.pathExistsSync(tmp))
      fs.removeSync(tmp);
    fs.mkdirSync(tmp);
  });

  const dir = path.join(tmp, 'CloudChains');
  const settingsDir = path.join(dir, 'settings');
  const ccFunc = () => { return dir; };

  it('CloudChains.constructor()', function() {
    const cc = new CloudChains(ccFunc);
    cc.getCloudChainsDir().should.be.equal(dir);
    cc._cloudChainsDir.should.be.equal(dir);
    cc.getSettingsDir().should.be.equal(settingsDir);
    cc._cloudChainsSettingsDir.should.be.equal(settingsDir);
  });

  describe('CloudChains install directories', function() {
    beforeEach(function() {
      if (fs.pathExistsSync(dir))
        fs.removeSync(dir);
    });
    it('CloudChains.isInstalled()', function() {
      const cc = new CloudChains(ccFunc);
      cc.isInstalled().should.be.false();
      cc.hasSettings().should.be.false();
      fs.mkdirpSync(settingsDir); // create directories outside app
      cc.isInstalled().should.be.true();
      cc.hasSettings().should.be.true();
    });
    it('CloudChains.getCloudChainsDir()', function() {
      fs.mkdirpSync(settingsDir); // create directories outside app
      const cc = new CloudChains(ccFunc);
      cc.getCloudChainsDir().should.be.equal(dir);
    });
    it('CloudChains.getSettingsDir()', function() {
      fs.mkdirpSync(settingsDir); // create directories outside app
      const cc = new CloudChains(ccFunc);
      cc.getCloudChainsDir().should.be.equal(dir);
    });
  });

  describe('CloudChains wallet confs', function() {
    const configMaster = path.join(settingsDir, 'config-master.json');
    const configBLOCK = path.join(settingsDir, 'config-BLOCK.json');
    const configBTC = path.join(settingsDir, 'config-BTC.json');
    beforeEach(function() {
      if (fs.pathExistsSync(settingsDir))
        fs.removeSync(settingsDir);
      fs.mkdirpSync(settingsDir);
      fs.writeFileSync(configMaster, JSON.stringify({
        "rpcPassword": "test",
        "fee": 1.0E-4,
        "rpcUsername": "user",
        "rpcPort": -1000,
        "feeFlat": true,
        "rpcEnabled": true,
        "addressCount": 20
      }));
      fs.writeFileSync(configBLOCK, JSON.stringify({
        "rpcPassword": "test",
        "fee": 1.0E-4,
        "rpcUsername": "user",
        "rpcPort": 41414,
        "feeFlat": true,
        "rpcEnabled": true,
        "addressCount": 20
      }));
      fs.writeFileSync(configBTC, JSON.stringify({
        "rpcPassword": "",
        "fee": 1.0E-4,
        "rpcUsername": "",
        "rpcPort": 8332,
        "feeFlat": true,
        "rpcEnabled": false,
        "addressCount": 20
      }));
    });

    it('CloudChains.getWalletConf()', function() {
      const cc = new CloudChains(ccFunc);
      should.not.exist(cc.getWalletConf('missing'));
      cc.loadConfs().should.be.true();
      cc.getWalletConf('BLOCK').should.be.eql(new CCWalletConf('BLOCK', fs.readJsonSync(configBLOCK)));
    });
    it('CloudChains.getMasterConf()', function() {
      const cc = new CloudChains(ccFunc);
      cc.loadConfs().should.be.true();
      cc.getMasterConf().should.be.eql(new CCWalletConf('master', fs.readJsonSync(configMaster)));
    });
    it('CloudChains.loadConfs()', function() {
      const cc = new CloudChains(ccFunc);
      cc.loadConfs().should.be.true();
      cc.getWalletConfs().length.should.be.equal(2); // master conf should not be picked up here
      cc.getMasterConf().ticker().should.be.equal('master'); // master conf should be valid
    });
  });

  it('CloudChains.runSetup()', function() {
    // TODO Implement test CloudChains.runSetup()
  });

  after(function() {
    if (fs.pathExistsSync(tmp))
      fs.removeSync(tmp);
  });
});
