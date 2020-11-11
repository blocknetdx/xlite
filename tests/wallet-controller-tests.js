/*global describe,it,before,after,beforeEach*/
/*eslint quotes: 0, key-spacing: 0*/
import should from 'should';
import {all, create} from 'mathjs';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import CloudChains from '../src/server/modules/cloudchains';
import ConfController from '../src/server/modules/conf-controller';
import FakeRPCController from './fake-rpc-controller';
import RPCTransaction from '../src/app/types/rpc-transaction';
import SimpleStorage from '../src/server/modules/storage';
import {storageKeys} from '../src/server/constants';
import TokenManifest from '../src/app/modules/token-manifest';
import Wallet from '../src/server/modules/wallet';
import WalletController from '../src/server/modules/wallet-controller';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

describe('WalletController Test Suite', function() {
  const tmp = path.join(os.tmpdir(), 'tests_walletcontroller_test_suite');
  before(function() {
    if (fs.pathExistsSync(tmp))
      fs.removeSync(tmp);
    fs.mkdirSync(tmp);
  });

  const storage = new SimpleStorage(); // memory only
  const dir = path.join(tmp, 'CloudChains');
  const settingsDir = path.join(dir, 'settings');
  const ccFunc = () => { return dir; };
  let confController;
  let tokenManifest;
  let cloudChains;
  const otxBLOCK = {
    txId: '50913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
    address: 'yBMQcUYNZ2g177GTb77ZT6wWoknfqobBMJ',
    amount: '10.100000',
    blockHash: 'ee37662083f6be532537663d2dc0d8f3a99af5ed4c68fb5d642325254294a017',
    blockTime: 1596660324,
    category: 'send',
    confirmations: 8865,
    time: 1596660284,
    trusted: true,
    hash: '50913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
    version: 1,
    size: 300,
    vSize: 300,
    vIn: [],
    vOut: [],
    hex: '01000000012c6f9f8c10cd5db62c01c591fd9e3736f42cec84ec59afea91fb7c0e503e20c8000000006a47304402203078ad70c8252be402f9f4d6e60e637528d648fb8dd0ebdfceaeb5ee03443eac02207536b8e8402b515ea495ad3b9e422aaa3f9c06fab34e0ec5a2a384aff5f3f87201210392b78bb64d3227c049ba3672a00f7ec300973b07581d88d972dbca0a727316bffeffffff021c3f1d0f6e0000001976a91419679b5b9d905671a2c0cd5798dde70d74cabc6388ac00f2052a010000001976a9149da5d5315113a53d7ff460e4011d455005b3acd988acebd60a00',
  };
  const otxBTC = {
    txId: '50913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
    address: '35x8RtuFsAnJCWEDQvJRDMi9Wa2k5Rs3Yp',
    amount: '1.12345678',
    blockHash: 'ee37662083f6be532537663d2dc0d8f3a99af5ed4c68fb5d642325254294a017',
    blockTime: 1596660324,
    category: 'send',
    confirmations: 8865,
    time: 1596660284,
    trusted: true,
    hash: '50913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
    version: 1,
    size: 300,
    vSize: 300,
    vIn: [],
    vOut: [],
    hex: '01000000012c6f9f8c10cd5db62c01c591fd9e3736f42cec84ec59afea91fb7c0e503e20c8000000006a47304402203078ad70c8252be402f9f4d6e60e637528d648fb8dd0ebdfceaeb5ee03443eac02207536b8e8402b515ea495ad3b9e422aaa3f9c06fab34e0ec5a2a384aff5f3f87201210392b78bb64d3227c049ba3672a00f7ec300973b07581d88d972dbca0a727316bffeffffff021c3f1d0f6e0000001976a91419679b5b9d905671a2c0cd5798dde70d74cabc6388ac00f2052a010000001976a9149da5d5315113a53d7ff460e4011d455005b3acd988acebd60a00',
  };
  const txBLOCK = new RPCTransaction(otxBLOCK);
  const txBTC = new RPCTransaction(otxBTC);
  const availableWallets = ['BLOCK', 'BTC'];

  beforeEach(async function() {
    storage.clear();
    const configMaster = path.join(settingsDir, 'config-master.json');
    const configBLOCK = path.join(settingsDir, 'config-BLOCK.json');
    const configBTC = path.join(settingsDir, 'config-BTC.json');
    if (fs.pathExistsSync(settingsDir))
      fs.removeSync(settingsDir);
    fs.mkdirpSync(settingsDir);
    fs.writeFileSync(configMaster, JSON.stringify({
      'rpcPassword': 'test',
      'fee': 1.0E-4,
      'rpcUsername': 'user',
      'rpcPort': -1000,
      'feeFlat': true,
      'rpcEnabled': true,
      'addressCount': 20
    }));
    fs.writeFileSync(configBLOCK, JSON.stringify({
      'rpcPassword': 'test',
      'fee': 1.0E-4,
      'rpcUsername': 'user',
      'rpcPort': 41414,
      'feeFlat': true,
      'rpcEnabled': true,
      'addressCount': 20
    }));
    fs.writeFileSync(configBTC, JSON.stringify({
      'rpcPassword': '',
      'fee': 1.0E-4,
      'rpcUsername': '',
      'rpcPort': 8332,
      'feeFlat': true,
      'rpcEnabled': false,
      'addressCount': 20
    }));
    const req = async (url) => {
      if (url === 'manifest-url') {
        const o = {};
        o.text = '{"manifest-latest.json":["b705da5df7d83ba3de48eb20fdc3cbf519ef6cc7","manifest-latest.json"]}';
        return o;
      } else if (url === 'manifest-latest.json') {
        const o = {};
        o.text = '[{"blockchain":"Blocknet","ticker":"BLOCK","ver_id":"blocknet--v4.0.1","ver_name":"Blocknetv4","conf_name":"blocknet.conf","dir_name_linux":"blocknet","dir_name_mac":"Blocknet","dir_name_win":"Blocknet","repo_url":"https://github.com/blocknetdx/blocknet","versions":["v4.3.0"],"xbridge_conf":"blocknet--v4.0.1.conf","wallet_conf":"blocknet--v4.0.1.conf"},{"blockchain":"Bitcoin","ticker":"BTC","ver_id":"bitcoin--v0.15.1","ver_name":"Bitcoinv0.15.x","conf_name":"bitcoin.conf","dir_name_linux":"bitcoin","dir_name_mac":"Bitcoin","dir_name_win":"Bitcoin","repo_url":"https://github.com/bitcoin/bitcoin","versions":["v0.15.1","v0.15.2"],"xbridge_conf":"bitcoin--v0.15.1.conf","wallet_conf":"bitcoin--v0.15.1.conf"}]';
        return o;
      } else if (url === 'xbridge-confs/blocknet--v4.0.1.conf') {
        const o = {};
        o.text = '[BLOCK]\\nTitle=Blocknet\\nAddress=\\nIp=127.0.0.1\\nPort=41414\\nUsername=\\nPassword=\\nAddressPrefix=26\\nScriptPrefix=28\\nSecretPrefix=154\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=1\\nDustAmount=0\\nCreateTxMethod=BTC\\nGetNewKeySupported=true\\nImportWithNoScanSupported=true\\nMinTxFee=10000\\nBlockTime=60\\nFeePerByte=20\\nConfirmations=0';
        return o;
      } else if (url === 'xbridge-confs/bitcoin--v0.15.1.conf') {
        const o = {};
        o.text = '[BTC]\\nTitle=Bitcoin\\nAddress=\\nIp=127.0.0.1\\nPort=8332\\nUsername=\\nPassword=\\nAddressPrefix=0\\nScriptPrefix=5\\nSecretPrefix=128\\nCOIN=100000000\\nMinimumAmount=0\\nTxVersion=2\\nDustAmount=0\\nCreateTxMethod=BTC\\nMinTxFee=7500\\nBlockTime=600\\nGetNewKeySupported=false\\nImportWithNoScanSupported=false\\nFeePerByte=120\\nConfirmations=1';
        return o;
      }
    };
    confController = new ConfController(storage, availableWallets);
    await confController.updateLatest('manifest-url', 'xbridge-confs/', '0123456789', 'manifest-latest.json', req).should.be.finally.true();
    tokenManifest = new TokenManifest(confController.getManifest(), confController.getXBridgeInfo());
    cloudChains = new CloudChains(ccFunc, storage);
    cloudChains.loadConfs();
  });

  it('WalletController()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, storage);
    wc._cloudChains.should.be.eql(cloudChains);
    wc._manifest.should.be.eql(tokenManifest);
    wc._storage.should.be.eql(storage);
  });
  it('WalletController.getWallets()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, storage);
    wc.loadWallets();
    wc.getWallets().should.be.an.Array();
    wc.getWallets().length.should.be.equal(2);
    wc.getWallets()[0].should.be.instanceof(Wallet);
  });
  it('WalletController.getWallet()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, storage);
    wc.loadWallets();
    should.not.exist(wc.getWallet('missing'));
    wc.getWallet('BLOCK').should.be.instanceof(Wallet);
  });
  it('WalletController.getEnabledWallets()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, storage);
    wc.loadWallets();
    wc.getEnabledWallets().should.be.an.Array();
    wc.getEnabledWallets().length.should.be.equal(1);
    wc.getEnabledWallets()[0].ticker.should.be.equal('BLOCK');
  });
  it('WalletController.getBalances()', function() {
    const balances = new Map([['BLOCK', ['100', '10']], ['BTC', ['100', '100']]]);
    storage.setItem(storageKeys.BALANCES, balances);
    const wc = new WalletController(cloudChains, tokenManifest, storage);
    wc.loadWallets();
    wc.getBalances().should.be.an.instanceof(Map);
    wc.getBalances().size.should.be.equal(2);
    wc.getBalances().get('BLOCK').should.be.eql(balances.get('BLOCK'));
    wc.getBalances().get('BTC').should.be.eql(balances.get('BTC'));
  });
  it('WalletController.loadWallets()', function() {
    const wc = new WalletController(cloudChains, tokenManifest, storage);
    wc.getWallets().should.be.an.Array();
    wc.getWallets().should.be.empty();
    wc.loadWallets();
    wc.getWallets().should.be.an.Array();
    wc.getWallets().should.not.be.empty();
  });
  it('WalletController.updatePriceMultipliers()', async function() {
    const currencyReq = async (ticker, currencies) => {
      if (ticker === 'BLOCK')
        return {body: {"USD":1.231,"BTC":0.000107}};
      if (ticker === 'BTC')
        return {body: {"USD":11200,"BTC":1.0}};
    };
    const BLOCK = (await currencyReq('BLOCK', [])).body;
    const BTC = (await currencyReq('BTC', [])).body;
    const multipliers = {BLOCK, BTC};
    const wc = new WalletController(cloudChains, tokenManifest, storage);
    wc.loadWallets();
    await wc.updatePriceMultipliers(currencyReq);
    storage.getItem(storageKeys.ALT_CURRENCY_MULTIPLIERS).should.be.eql(multipliers);
  });
  it('WalletController.updatePriceMultipliers() bad request', async function() {
    const multipliers = {};
    const currencyReq = async (ticker, currencies) => { return { err: multipliers }; };
    const wc = new WalletController(cloudChains, tokenManifest, storage);
    wc.loadWallets();
    await wc.updatePriceMultipliers(currencyReq);
    const expected = {};
    for (const wallet of wc.getWallets())
      expected[wallet.ticker] = {};
    storage.getItem(storageKeys.ALT_CURRENCY_MULTIPLIERS).should.be.eql(expected);
  });

  let balances;
  let fakerpc;
  const updateBalancePrep = async () => {
    balances = new Map();
    fakerpc = new FakeRPCController();
    const wc = new WalletController(cloudChains, tokenManifest, storage);
    wc.loadWallets();
    const fakeunspent = await fakerpc.listUnspent();
    let total = bignumber(0);
    let spendable = bignumber(0);
    for (const utxo of fakeunspent) {
      total = math.add(total, utxo.amount);
      if (utxo.spendable)
        spendable = math.add(spendable, utxo.amount);
    }
    const balance = [total.toNumber().toFixed(8), spendable.toNumber().toFixed(8)];
    for (const wallet of wc.getWallets()) {
      wallet.rpc = fakerpc;
      if (wallet.rpcEnabled()) // balances should not include disabled wallets
        balances.set(wallet.ticker, balance);
    }
    await wc.updateAllBalances();
    return wc;
  };

  it('WalletController.updateAllBalances()', async function() {
    const wc = await updateBalancePrep();
    storage.getItem(storageKeys.BALANCES).should.be.eql(Array.from(balances));
    const wallet = wc.getWallet('BLOCK');
    await wallet.getTransactions().should.finally.be.eql(await fakerpc.listTransactions());
  });
  it('WalletController._updateBalanceInfo()', async function() {
    const wc = await updateBalancePrep();
    const wallet = wc.getWallet('BLOCK');
    const oldBalances = wc.getBalances();
    const newBalances = await wc._updateBalanceInfo(wallet.ticker);
    newBalances.should.be.eql(oldBalances.get('BLOCK'));
  });
  it('WalletController._updateBalanceInfo() should not update on wallet error', async function() {
    const wc = await updateBalancePrep();
    const wallet = wc.getWallet('BLOCK');
    wallet.getBalance = async function() { throw new Error('fail'); };
    const expectNull = await wc._updateBalanceInfo(wallet.ticker);
    should.not.exist(expectNull);
  });

  after(function() {
    if (fs.pathExistsSync(tmp))
      fs.removeSync(tmp);
  });
});
