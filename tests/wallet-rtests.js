/* global describe,it,beforeEach,after */
/*eslint quotes: 0, key-spacing: 0*/
import should from 'should';

import './rtests';
import domStorage from '../src/app/modules/dom-storage';
import FakeApi, {resolvePromise} from './fake-api';
import {localStorageKeys} from '../src/app/constants';
import LWDB from '../src/app/modules/lwdb';
import Recipient from '../src/app/types/recipient';
import RPCTransaction from '../src/app/types/rpc-transaction';
import {sanitize, Blacklist, Whitelist} from '../src/app/modules/api-r';
import Token from '../src/app/types/token';
import {unixTime} from '../src/app/util';
import Wallet from '../src/app/types/wallet-r';
import XBridgeInfo from '../src/app/types/xbridgeinfo';

describe('Wallet Test Suite', function() {
  const appStorage = domStorage;
  const db = new LWDB('test_LWDB');
  let token;
  let walletData;
  const fakeApi = window.api;
  const sortFn = (a,b) => a.txId.localeCompare(b.txId);

  beforeEach(function() {
    appStorage.clear();
    db.clear();
    token = new Token({
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
    });
    token.xbinfo = new XBridgeInfo({ ticker: 'BLOCK', feeperbyte: 20, mintxfee: 10000, coin: 100000000, rpcport: 41414 });
    walletData = sanitize({ticker: token.ticker, name: token.blockchain, _token: token, _rpcEnabled: true}, Blacklist, Whitelist);
    Object.assign(fakeApi, FakeApi(fakeApi));
  });

  it('Wallet()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet._token.should.be.eql(token);
    wallet._storage.should.be.eql(appStorage);
    wallet.ticker.should.be.equal(token.ticker);
    wallet.name.should.be.equal(token.blockchain);
    wallet.imagePath.should.be.equal(Wallet.getImage(wallet.ticker));
    wallet.rpcEnabled().should.be.true();
  });
  it('Wallet.rpcEnabled() Wallet._rpcFetch()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    await wallet._rpcFetch(unixTime());
    wallet.rpcEnabled().should.be.true();
    should.not.exist(wallet.rpc);
    fakeApi.wallet_rpcEnabled = () => resolvePromise(false);
    const wallet2 = new Wallet(walletData, fakeApi, appStorage, db);
    await wallet2._rpcFetch(unixTime());
    wallet2.rpcEnabled().should.be.false();
  });
  it('Wallet.blockchain()', function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet.blockchain().should.be.equal(token.blockchain);
  });
  it('Wallet.token()', function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet.token().should.be.eql(token);
  });
  it('Wallet.getBalance()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const balance = await wallet.getBalance();
    balance.should.be.eql(await fakeApi.wallet_getBalance(wallet.ticker));
  });
  it('Wallet.getTransactions()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeTxs = await fakeApi.wallet_getTransactions(wallet.ticker);
    await wallet.updateTransactions();
    const txs = (await wallet.getTransactions()).sort(sortFn);
    txs.should.be.eql(fakeTxs.map(o => new RPCTransaction(o, wallet.ticker)).sort(sortFn));
  });
  it('Wallet.getTransactions() with timeframe', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const startTime = 1596654100;
    const endTime = 1596654200;
    const fakeTxs = await fakeApi.wallet_getTransactions(wallet.ticker, startTime, endTime);
    await wallet.updateTransactions();
    const txs = (await wallet.getTransactions(startTime, endTime)).sort(sortFn);
    txs.should.be.eql(fakeTxs.map(o => new RPCTransaction(o, wallet.ticker)).sort(sortFn));
  });
  it('Wallet.getTransactions() no transactions outside timeframe', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const startTime = 1596654201;
    const endTime = 1596654300;
    await wallet.updateTransactions();
    const txs = await wallet.getTransactions(startTime, endTime);
    txs.should.be.eql([]);
  });
  it('Wallet.getTransactions() timeframe with same start and end', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeTxs1 = await fakeApi.wallet_getTransactions(wallet.ticker);
    const startTime = fakeTxs1[0].time;
    const endTime = fakeTxs1[0].time;
    await wallet.updateTransactions();
    const txs = (await wallet.getTransactions(startTime, endTime)).sort(sortFn);
    const fakeTxs2 = await fakeApi.wallet_getTransactions(wallet.ticker, startTime, endTime);
    txs.should.be.eql(fakeTxs2.map(o => new RPCTransaction(o, wallet.ticker)).sort(sortFn));
    txs.length.should.be.equal(1); // expecting only 1 transaction
  });
  it('Wallet.updateTransactions()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeTxs = await fakeApi.wallet_getTransactions(wallet.ticker);
    await wallet.updateTransactions().should.finally.be.true();
    const txs = (await wallet.getTransactions()).sort(sortFn);
    txs.should.be.eql(fakeTxs.map(o => new RPCTransaction(o, wallet.ticker)).sort(sortFn));
  });
  it('Wallet.updateTransactions() should not update too soon', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    await wallet.updateTransactions().should.finally.be.true();
    await wallet.updateTransactions().should.finally.be.false(); // no update too soon
  });
  it('Wallet._needsTransactionUpdate()', function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet._needsTransactionUpdate().should.be.true();
    wallet._setLastTransactionFetchTime(unixTime());
    wallet._needsTransactionUpdate().should.be.false();
  });
  it('Wallet._getLastTransactionFetchTime()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet._getLastTransactionFetchTime().should.be.equal(0); // check default state
    await wallet.updateTransactions();
    const fetchTime = appStorage.getItem(wallet._getTransactionFetchTimeStorageKey());
    wallet._getLastTransactionFetchTime().should.be.equal(fetchTime);
  });
  it('Wallet._getLastTransactionFetchTime() negative fetch time should be 0', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    appStorage.setItem(wallet._getTransactionFetchTimeStorageKey(), -1000);
    wallet._getLastTransactionFetchTime().should.be.equal(0);
  });
  it('Wallet._setLastTransactionFetchTime()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet._setLastTransactionFetchTime(2500);
    appStorage.getItem(wallet._getTransactionFetchTimeStorageKey()).should.be.equal(2500);
  });
  it('Wallet._setLastTransactionFetchTime() when less than 0 should set 0', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet._setLastTransactionFetchTime(-1000);
    appStorage.getItem(wallet._getTransactionFetchTimeStorageKey()).should.be.equal(0);
  });
  it('Wallet._getTransactionStorageKey()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet._getTransactionStorageKey().should.be.equal(localStorageKeys.TRANSACTIONS + '_' + wallet.ticker);
  });
  it('Wallet._getTransactionFetchTimeStorageKey()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet._getTransactionFetchTimeStorageKey().should.be.equal(localStorageKeys.TX_LAST_FETCH_TIME + '_' + wallet.ticker);
  });
  it('Wallet._getTransactionsFromStorage()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeTxs = await fakeApi.wallet_getTransactions(wallet.ticker);
    await wallet.updateTransactions();
    (await wallet._getTransactionsFromStorage(0, 5000000000)).sort(sortFn).should.be.eql(fakeTxs.map(o => new RPCTransaction(o, wallet.ticker)).sort(sortFn));
  });
  it('Wallet._getTransactionsFromStorage() end less than start should set end=start', async function() {
    fakeApi.wallet_getTransactions = (ticker) => {
      return [
        new RPCTransaction({ txId: 'A', n: 0, address: 'afjdsakjfksdajk', amount: 10.000, time: 1000 }), // no ticker on rpc txs
        new RPCTransaction({ txId: 'B', n: 0, address: 'afjdsakjfksdajk', amount: 10.000, time: 2000 }),
        new RPCTransaction({ txId: 'c', n: 0, address: 'afjdsakjfksdajk', amount: 10.000, time: 3000 }),
      ];
    };
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    await wallet.updateTransactions();
    const expectedTxs = [new RPCTransaction((await fakeApi.wallet_getTransactions(wallet.ticker))[0], wallet.ticker)];
    (await wallet._getTransactionsFromStorage(1000, 900)).sort(sortFn).should.be.eql(expectedTxs);
  });
  it('Wallet._addTransactionsToStorage()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeTxs = await fakeApi.wallet_getTransactions(wallet.ticker);
    await wallet.updateTransactions();
    const addTxs = [
      new RPCTransaction({ txId: 'A', n: 0, address: 'afjdsakjfksdajk', amount: 10.000 }, wallet.ticker),
      new RPCTransaction({ txId: 'B', n: 0, address: 'afjdsakjfksdajk', amount: 11.000 }, wallet.ticker),
    ];
    await wallet._addTransactionsToStorage(addTxs).should.finally.be.true();
    (await wallet.getTransactions()).sort(sortFn).should.eql(fakeTxs.map(o => new RPCTransaction(o, wallet.ticker)).concat(addTxs).sort(sortFn));
  });
  it('Wallet._addTransactionsToStorage() should not update non-array', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeTxs = await fakeApi.wallet_getTransactions(wallet.ticker);
    await wallet.updateTransactions();
    await wallet._addTransactionsToStorage({}).should.finally.be.false();
    (await wallet.getTransactions()).sort(sortFn).should.eql(fakeTxs.map(o => new RPCTransaction(o, wallet.ticker)).sort(sortFn));
  });
  it('Wallet._addTransactionsToStorage() should not include duplicates', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeTxs = await fakeApi.wallet_getTransactions(wallet.ticker);
    await wallet.updateTransactions();
    const addTxs = [
      new RPCTransaction({ txId: 'A', n: 0, address: 'afjdsakjfksdajk', amount: 10.000 }, wallet.ticker),
      new RPCTransaction({ txId: 'B', n: 0, address: 'afjdsakjfksdajk', amount: 11.000 }, wallet.ticker),
    ];
    const duplTxs = [
      new RPCTransaction({ txId: 'A', n: 0, address: 'afjdsakjfksdajk', amount: 10.000 }, wallet.ticker),
      new RPCTransaction({ txId: 'B', n: 0, address: 'afjdsakjfksdajk', amount: 11.000 }, wallet.ticker),
    ];
    await wallet._addTransactionsToStorage(addTxs.concat(duplTxs)).should.finally.be.true();
    (await wallet.getTransactions()).sort(sortFn).should.eql(fakeTxs.map(o => new RPCTransaction(o, wallet.ticker)).concat(addTxs).sort(sortFn));
  });
  it('Wallet._fetchTransactions()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeTxs = (await fakeApi.wallet_getTransactions(wallet.ticker))
                      .map(o => new RPCTransaction(o, wallet.ticker)).sort(sortFn);
    const fetchTime = unixTime();
    (await wallet._fetchTransactions()).sort(sortFn).should.be.eql(fakeTxs);
    (await wallet.getTransactions()).should.eql(fakeTxs);
    wallet._getLastTransactionFetchTime().should.be.greaterThanOrEqual(fetchTime);
  });
  it('Wallet._fetchTransactions() should not update server txs if endtime < last_fetch_time', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const addTxs = [
      new RPCTransaction({ txId: 'A', n: 0, address: 'afjdsakjfksdajk', amount: 10.000, time: 10000 }, wallet.ticker),
      new RPCTransaction({ txId: 'B', n: 0, address: 'afjdsakjfksdajk', amount: 11.000, time: 10000 }, wallet.ticker),
    ];
    await wallet._addTransactionsToStorage(addTxs).should.finally.be.true();
    wallet._setLastTransactionFetchTime(20000);
    (await wallet._fetchTransactions(0, 19000)).sort(sortFn).should.be.eql(addTxs.sort(sortFn));
  });
  it('Wallet._fetchTransactions() should return existing txs on rpc error', async function() {
    fakeApi.wallet_getTransactions = (ticker) => { throw new Error(''); };
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const addTxs = [
      new RPCTransaction({ txId: 'A', n: 0, address: 'afjdsakjfksdajk', amount: 10.000, time: 10000 }, wallet.ticker),
      new RPCTransaction({ txId: 'B', n: 0, address: 'afjdsakjfksdajk', amount: 11.000, time: 10000 }, wallet.ticker),
    ];
    await wallet._addTransactionsToStorage(addTxs).should.finally.be.true();
    (await wallet._fetchTransactions()).sort(sortFn).should.be.eql(addTxs.sort(sortFn));
  });
  it('Wallet._fetchTransactions() should not throw on rpc error', async function() {
    fakeApi.wallet_getTransactions = () => { throw new Error(''); };
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    should.doesNotThrow(await wallet._fetchTransactions, Error);
  });
  it('Wallet.getAddresses()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeAddrs = await fakeApi.wallet_getAddresses(wallet.ticker);
    const addrs = await wallet.getAddresses();
    addrs.should.be.eql(fakeAddrs);
  });
  it('Wallet.generateNewAddress()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const addr = await wallet.generateNewAddress();
    addr.should.be.a.String().and.not.equal('');
  });
  it('Wallet.getCachedUnspent()', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const fakeUtxos = await fakeApi.wallet_getCachedUnspent(wallet.ticker);
    await wallet.getCachedUnspent(60).should.finally.be.eql(fakeUtxos);
  });
  it('Wallet.getExplorerLink should return a link string', function() {
    const explorerLink = 'https://test-block-explorer.com';
    fakeApi.explorerLink = explorerLink;
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet.getExplorerLink().should.equal(explorerLink);
  });
  it('Wallet.getExplorerLinkForTx() should return a link string', async function() {
    const explorerTxLink = 'https://test-block-explorer.com';
    fakeApi.explorerTxLink = explorerTxLink;
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const tx = 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0';
    wallet.getExplorerLinkForTx(tx)
      .should.equal(explorerTxLink + '/' + tx);
  });
  it('Wallet.getWebsiteLink() should return a link string', function() {
    const websiteLink = 'https://test-crypto-site.com';
    fakeApi.websiteLink = websiteLink;
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    wallet.getWebsiteLink().should.equal(websiteLink);
  });
  it('Wallet.send() should succeed', async function() {
    const wallet = new Wallet(walletData, fakeApi, appStorage, db);
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 50, description: '' })];
    const txid = await wallet.send(recipients);
    should.exist(txid);
    txid.should.be.equal(await fakeApi.wallet_send(wallet.ticker));
  });

  after(function() {
    appStorage.clear();
    db.clear();
  });
});
