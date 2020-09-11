/*global describe,it,before,after,beforeEach*/
/*eslint quotes: 0, key-spacing: 0*/
import should from 'should';
import {combineReducers, createStore} from 'redux';
import {Map as IMap} from 'immutable';

import './rtests';
import * as appActions from '../src/app/actions/app-actions';
import appReducer from '../src/app/reducers/app-reducer';
import domStorage from '../src/app/modules/dom-storage';
import FakeApi, {resolvePromise, txBLOCK, txBTC} from './fake-api';
import {localStorageKeys} from '../src/app/constants';
import moment from 'moment';
import {multiplierForCurrency, oneDaySeconds, oneHourSeconds, oneWeekSeconds, unixTime} from '../src/app/util';
import RPCTransaction from '../src/app/types/rpc-transaction';
import TokenManifest from '../src/app/modules/token-manifest';
import Wallet from '../src/app/types/wallet-r';
import WalletController from '../src/app/modules/wallet-controller-r';
import XBridgeInfo from '../src/app/types/xbridgeinfo';

describe('WalletController Test Suite', function() {
  const storage = domStorage;
  const fakeApi = window.api;

  before(function() {
    storage.clear();
  });

  let tokenManifest;
  const tokenManifestData = JSON.parse(`[{
    "blockchain": "Blocknet",
    "ticker": "BLOCK",
    "ver_id": "blocknet--v4.0.1",
    "ver_name": "Blocknet v4",
    "conf_name": "blocknet.conf",
    "dir_name_linux": "blocknet",
    "dir_name_mac": "Blocknet",
    "dir_name_win": "Blocknet",
    "repo_url": "https://github.com/blocknetdx/blocknet",
    "versions": [
      "v4.3.0"
    ],
    "xbridge_conf": "blocknet--v4.0.1.conf",
    "wallet_conf": "blocknet--v4.0.1.conf"
  },
  {
    "blockchain": "Bitcoin",
    "ticker": "BTC",
    "ver_id": "bitcoin--v0.15.1",
    "ver_name": "Bitcoin v0.15.x",
    "conf_name": "bitcoin.conf",
    "dir_name_linux": "bitcoin",
    "dir_name_mac": "Bitcoin",
    "dir_name_win": "Bitcoin",
    "repo_url": "https://github.com/bitcoin/bitcoin",
    "versions": [
      "v0.15.1",
      "v0.15.2"
    ],
    "xbridge_conf": "bitcoin--v0.15.1.conf",
    "wallet_conf": "bitcoin--v0.15.1.conf"
  }]`);
  const feeBLOCK = new XBridgeInfo({ ticker: 'BLOCK', feeperbyte: 20, mintxfee: 10000, coin: 100000000 });
  const feeBTC = new XBridgeInfo({ ticker: 'BTC', feeperbyte: 120, mintxfee: 7500, coin: 100000000 });

  beforeEach(async function() {
    storage.clear();
    tokenManifest = new TokenManifest(tokenManifestData, [feeBLOCK, feeBTC]);
    Object.assign(fakeApi, FakeApi(fakeApi));
  });

  it('WalletController()', function() {
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    wc._api.should.be.eql(fakeApi);
    wc._manifest.should.be.eql(tokenManifest);
    wc._domStorage.should.be.eql(storage);
  });
  it('WalletController.getWallets()', async function() {
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    (await wc.getWallets()).should.be.an.Array();
    (await wc.getWallets()).length.should.be.equal((await fakeApi.walletController_getWallets()).length);
    (await wc.getWallets())[0].should.be.instanceof(Wallet);
  });
  it('WalletController.getWallet()', async function() {
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    should.not.exist((await wc.getWallet('missing')));
    (await wc.getWallet('BLOCK')).should.be.instanceof(Wallet);
    (await wc.getWallet('BTC')).should.be.instanceof(Wallet);
  });
  it('WalletController.getEnabledWallets()', async function() {
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    (await wc.getEnabledWallets()).should.be.an.Array();
    (await wc.getEnabledWallets()).length.should.be.equal((await fakeApi.walletController_getWallets()).length);
    should.exist((await wc.getEnabledWallets()).find(w => w.ticker === 'BLOCK'));
    should.exist((await wc.getEnabledWallets()).find(w => w.ticker === 'BTC'));
  });
  it('WalletController.getBalances()', async function() {
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    (await wc.getBalances()).should.be.an.instanceof(Map);
    (await wc.getBalances()).size.should.be.equal(2);
    (await wc.getBalances()).get('BLOCK').should.be.eql((await fakeApi.walletController_getBalances()).get('BLOCK'));
    (await wc.getBalances()).get('BTC').should.be.eql((await fakeApi.walletController_getBalances()).get('BTC'));
  });
  it('WalletController.getTransactions()', async function() {
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    await wc.updateAllBalances();
    (await wc.getTransactions()).should.be.an.instanceof(Map);
    (await wc.getTransactions()).has('BLOCK').should.be.true();
    const sortFn = (a,b) => a.txId.localeCompare(b.txId);
    const txs = (await wc.getTransactions()).get('BLOCK').sort(sortFn);
    const fakeTxs = (await fakeApi.wallet_getTransactions('BLOCK')).map(fakeTx => new RPCTransaction(fakeTx)).sort(sortFn);
    txs.should.be.eql(fakeTxs);
  });
  it('WalletController.getBalanceOverTime() including cache test', async function() {
    const et = unixTime();
    const txs = [
      new RPCTransaction({ txId: 'E', address: 'afjdsakjfksdajk', amount: 2.001589, category: 'receive', time: et - oneHourSeconds }),
      new RPCTransaction({ txId: 'D', address: 'afjdsakjfksdajk', amount: 5.000, category: 'send', time: et - oneHourSeconds*5 }),
      new RPCTransaction({ txId: 'C', address: 'afjdsakjfksdajk', amount: 1.000, category: 'send', time: et - oneDaySeconds }),
      new RPCTransaction({ txId: 'B', address: 'afjdsakjfksdajk', amount: 10.000, category: 'receive', time: et - oneDaySeconds*3 }),
      new RPCTransaction({ txId: 'A', address: 'afjdsakjfksdajk', amount: 15.000, category: 'receive', time: et - oneWeekSeconds }),
    ];
    fakeApi.wallet_getTransactions = async (ticker) => {
      if (ticker === 'BLOCK')
        return txs;
      else
        return [];
    };
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    const blockWallet = await wc.getWallet('BLOCK');
    await blockWallet.updateTransactions();
    const currencyMultipliers = {'BLOCK': {'USD': 1.50}};
    const balances = await wc.getBalanceOverTime('week', 'USD', currencyMultipliers);
    const st = moment.unix(et-oneWeekSeconds).startOf('day');
    const expecting = Math.ceil((et-st.unix())/oneHourSeconds);
    balances.length.should.be.equal(expecting);
    const getBalance = (transactions) => {
      let balancesTotal = 0;
      for (const tx of transactions) {
        if (tx.isReceive())
          balancesTotal += tx.amount * multiplierForCurrency('BLOCK', 'USD', currencyMultipliers);
        else
          balancesTotal -= tx.amount * multiplierForCurrency('BLOCK', 'USD', currencyMultipliers);
      }
      return balancesTotal;
    };
    balances[balances.length-1][1].should.be.equal(getBalance(await fakeApi.wallet_getTransactions('BLOCK')));
    // Expecting cache to be pulled when calls are one after the other
    const copyTxs = txs.slice();
    txs.push(new RPCTransaction({ txId: 'Another tx', address: 'afjdsakjfksdajk', amount: 100.50, category: 'receive', time: et - 60 }));
    await blockWallet.updateTransactions();
    const nbalances = await wc.getBalanceOverTime('week', 'USD', currencyMultipliers);
    nbalances[nbalances.length-1][1].should.be.equal(getBalance(copyTxs)); // expecting to receive old cached data
  });
  it('WalletController.getBalanceOverTime() should exclude data outside timeframe', async function() {
    const et = unixTime();
    const txs = [
      new RPCTransaction({ txId: 'E', address: 'afjdsakjfksdajk', amount: 1.99999999, category: 'receive', time: et - oneHourSeconds }),
      new RPCTransaction({ txId: 'D', address: 'afjdsakjfksdajk', amount: 5.000, category: 'send', time: et - oneHourSeconds*5 }),
      new RPCTransaction({ txId: 'C', address: 'afjdsakjfksdajk', amount: 10.000, category: 'send', time: et - oneDaySeconds }),
      new RPCTransaction({ txId: 'B', address: 'afjdsakjfksdajk', amount: 20.000, category: 'receive', time: et - oneDaySeconds*3 }),
      new RPCTransaction({ txId: 'A', address: 'afjdsakjfksdajk', amount: 30.000, category: 'receive', time: et - oneWeekSeconds }),
    ];
    fakeApi.wallet_getTransactions = async (ticker) => {
      if (ticker === 'BLOCK')
        return txs;
      else
        return [];
    };
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    const blockWallet = await wc.getWallet('BLOCK');
    await blockWallet.updateTransactions();
    const currencyMultipliers = {'BLOCK': {'USD': 1}}; // use 1 for easier debugging
    const balances = await wc.getBalanceOverTime('day', 'USD', currencyMultipliers);
    const getBalance = (transactions) => {
      let balancesTotal = 0;
      for (const tx of transactions) {
        if (tx.isReceive())
          balancesTotal += tx.amount * multiplierForCurrency('BLOCK', 'USD', currencyMultipliers);
        else
          balancesTotal -= tx.amount * multiplierForCurrency('BLOCK', 'USD', currencyMultipliers);
      }
      return balancesTotal;
    };
    balances[0][1].should.be.equal(50); // Expecting initial balance (A,B txs are outside starting timeframe)
    balances[balances.length-1][1].should.be.equal(getBalance((await fakeApi.wallet_getTransactions('BLOCK'))));
  });
  it('WalletController.getActiveWallet()', async function() {
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    should.not.exist((await wc.getActiveWallet()));
    storage.setItem(localStorageKeys.ACTIVE_WALLET, 'BLOCK');
    (await wc.getActiveWallet()).should.be.equal('BLOCK');
    storage.setItem(localStorageKeys.ACTIVE_WALLET, 'missing');
    should.not.exist((await wc.getActiveWallet()));
  });
  it('WalletController.setActiveWallet()', async function() {
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    await wc.setActiveWallet('missing');
    should.not.exist(storage.getItem(localStorageKeys.ACTIVE_WALLET)); // missing token should not be saved to storage
    await wc.setActiveWallet('BLOCK');
    (await wc.getActiveWallet()).should.be.equal('BLOCK');
  });
  it('WalletController.dispatchWallets()', async function() {
    const combinedReducers = combineReducers({ appState: appReducer });
    const store = createStore(combinedReducers);
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    store.getState().appState.wallets.should.be.an.Array(); // state should not be valid before dispatch
    store.getState().appState.wallets.should.be.empty();
    await wc.dispatchWallets(appActions.setWallets, store);
    store.getState().appState.wallets.should.be.eql(Array.from((await wc.getWallets()).values()));
  });
  it('WalletController.dispatchBalances()', async function() {
    const combinedReducers = combineReducers({ appState: appReducer });
    const store = createStore(combinedReducers);
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    store.getState().appState.balances.should.be.an.instanceof(IMap); // state should not be valid before dispatch
    store.getState().appState.balances.should.be.eql(IMap());
    const balances = new Map([['BLOCK', ['100', '10']], ['BTC', ['100', '100']]]);
    fakeApi.walletController_getBalances = async () => balances;
    await wc.dispatchBalances(appActions.setBalances, store);
    store.getState().appState.balances.should.be.eql(IMap(balances));
    store.getState().appState.balances.get('BLOCK')[0].should.be.equal(balances.get('BLOCK')[0]);
    store.getState().appState.balances.get('BLOCK')[1].should.be.equal(balances.get('BLOCK')[1]);
    store.getState().appState.balances.get('BTC')[0].should.be.equal(balances.get('BTC')[0]);
    store.getState().appState.balances.get('BTC')[1].should.be.equal(balances.get('BTC')[1]);
  });
  it('WalletController.dispatchTransactions() updateAllBalances()', async function() {
    const combinedReducers = combineReducers({ appState: appReducer });
    const store = createStore(combinedReducers);
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    store.getState().appState.transactions.should.be.an.instanceof(IMap); // state should not be valid before dispatch
    store.getState().appState.transactions.should.be.eql(IMap());
    const transactions = new Map([['BLOCK', [txBLOCK]], ['BTC', [txBTC]]]);
    fakeApi.wallet_getTransactions = ticker => resolvePromise(transactions.get(ticker));
    await wc.updateAllBalances();
    await wc.dispatchTransactions(appActions.setTransactions, store);
    store.getState().appState.transactions.should.be.eql(IMap(transactions));
    store.getState().appState.transactions.get('BLOCK')[0].should.be.eql(transactions.get('BLOCK')[0]);
    store.getState().appState.transactions.get('BTC')[0].should.be.eql(transactions.get('BTC')[0]);
  });
  it('WalletController.dispatchPriceMultipliers() updatePriceMultipliers()', async function() {
    const combinedReducers = combineReducers({ appState: appReducer });
    const store = createStore(combinedReducers);
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    store.getState().appState.currencyMultipliers.should.be.an.instanceof(Object); // state should not be valid before dispatch
    store.getState().appState.currencyMultipliers.should.be.eql({});
    const multipliers = {BLOCK: {"USD":1.231,"BTC":0.000107}, BTC: {"USD":11200,"BTC":1.0}};
    fakeApi.walletController_getCurrencyMultipliers = () => resolvePromise(multipliers);
    await wc.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);
    store.getState().appState.currencyMultipliers.should.be.eql(multipliers);
    store.getState().appState.currencyMultipliers['BLOCK'].should.be.eql(multipliers['BLOCK']);
    store.getState().appState.currencyMultipliers['BTC'].should.be.eql(multipliers['BTC']);
  });
  it('WalletController.updateBalanceInfo()', async function() {
    let balances;
    const wc = new WalletController(fakeApi, tokenManifest, storage);
    await wc.loadWallets();
    const emptyBalance = ['0', '0'];
    fakeApi.walletController_getBalances = () => resolvePromise(new Map([["BLOCK", emptyBalance], ["BTC", emptyBalance]]));
    await wc.updateAllBalances();
    balances = await wc.getBalances();
    balances.get('BLOCK').should.be.eql(emptyBalance);
    balances.get('BTC').should.be.eql(emptyBalance);
    fakeApi.walletController_getBalances = () => resolvePromise(new Map([["BLOCK", ["0.31", "0.31"]], ["BTC", emptyBalance]]));;
    await wc.updateBalanceInfo('BLOCK');
    balances = await wc.getBalances();
    balances.get('BLOCK').should.be.eql(["0.31", "0.31"]);
    balances.get('BTC').should.be.eql(emptyBalance);
    await wc.updateBalanceInfo('BTC');
    fakeApi.walletController_getBalances = () => resolvePromise(new Map([["BLOCK", ["0.31", "0.31"]], ["BTC", ["0.41", "0.41"]]]));;
    balances = await wc.getBalances();
    balances.get('BLOCK').should.be.eql(["0.31", "0.31"]);
    balances.get('BTC').should.be.eql(["0.41", "0.41"]);
  });

  after(function() {
    storage.clear();
  });
});
