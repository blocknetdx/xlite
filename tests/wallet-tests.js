/* global describe,it,should,beforeEach */
/*eslint quotes: 0, key-spacing: 0*/
import 'should';
import {all, create} from 'mathjs';
const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

import CCWalletConf from '../src/app/types/ccwalletconf';
import FakeRPCController from './fake-rpc-controller';
import Recipient from '../src/app/types/recipient';
import RPCController from '../src/server/modules/rpc-controller';
import RPCTransaction from '../src/app/types/rpc-transaction';
import RPCUnspent from '../src/app/types/rpc-unspent';
import SimpleStorage from '../src/server/modules/storage';
import {storageKeys} from '../src/server/constants';
import Token from '../src/app/types/token';
import {unixTime} from '../src/app/util';
import Wallet from '../src/server/modules/wallet';
import XBridgeInfo from '../src/app/types/xbridgeinfo';

describe('Wallet Test Suite', function() {
  const appStorage = new SimpleStorage();
  let token;
  let conf;
  beforeEach(function() {
    appStorage.clear();
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
    conf = new CCWalletConf(token.ticker, {
      "rpcPassword": "test",
      "fee": 1.0E-4,
      "rpcUsername": "testUser",
      "rpcPort": 41414,
      "feeFlat": true,
      "rpcEnabled": true,
      "addressCount": 20
    });
  });

  it('Wallet()', function() {
    const wallet = new Wallet(token, conf, appStorage);
    wallet._token.should.be.eql(token);
    wallet._conf.should.be.eql(conf);
    wallet._storage.should.be.eql(appStorage);
    wallet.ticker.should.be.equal(token.ticker);
    wallet.ticker.should.be.equal(conf.ticker());
    wallet.name.should.be.equal(token.blockchain);
    wallet.rpcEnabled().should.be.true();
    wallet.rpc.should.be.eql(new RPCController(41414, 'testUser', 'test'));
  });
  it('Wallet.rpcEnabled() Wallet.initRpcIfEnabled()', function() {
    const wallet = new Wallet(token, conf, appStorage);
    wallet.initRpcIfEnabled();
    wallet.rpcEnabled().should.be.true();
    wallet.rpc.should.be.eql(new RPCController(41414, 'testUser', 'test'));
    conf.rpcEnabled = false;
    const wallet2 = new Wallet(token, conf, appStorage);
    wallet2.initRpcIfEnabled();
    wallet2.rpcEnabled().should.be.false();
    wallet2.rpc.should.be.eql(new RPCController(0, '', ''));
  });
  it('Wallet.rpcReady()', async function() {
    const wallet = new Wallet(token, conf, appStorage);
    wallet.initRpcIfEnabled();
    wallet.rpcEnabled().should.be.true();
    wallet.rpc.getInfo = () => new Promise(resolve => resolve({rpcready: true}));
    await wallet.rpcReady().should.finally.be.true();
  });
  it('Wallet.rpcReady() with timeouts', async function() {
    this.timeout(2500);
    const wallet = new Wallet(token, conf, appStorage);
    wallet.initRpcIfEnabled();
    wallet.rpcEnabled().should.be.true();
    wallet.rpc.getInfo = () => new Promise(resolve => resolve({rpcready: false}));
    await wallet.rpcReady(500, 250).should.finally.be.false();
    setTimeout(() => {
      wallet.rpc.getInfo = () => new Promise(resolve => resolve({rpcready: true}));
    }, 750);
    await wallet.rpcReady(1750, 250).should.finally.be.true();
  });
  it('Wallet.rpcReady() with timeouts should fail on timeout', async function() {
    const wallet = new Wallet(token, conf, appStorage);
    wallet.initRpcIfEnabled();
    wallet.rpcEnabled().should.be.true();
    wallet.rpc.getInfo = () => new Promise(resolve => resolve({rpcready: false}));
    const startTime = Date.now();
    await wallet.rpcReady(750, 250).should.finally.be.false();
    (Date.now() - startTime).should.be.greaterThanOrEqual(750);
  });
  it('Wallet.rpcReady() fails on bad rpc', async function() {
    const wallet = new Wallet(token, conf, appStorage);
    wallet.initRpcIfEnabled();
    wallet._conf.rpcEnabled = false;
    wallet.rpcEnabled().should.be.false();
    await wallet.rpcReady().should.finally.be.false();
  });
  it('Wallet.rpcReady() fails on bad getinfo rpc', async function() {
    const wallet = new Wallet(token, conf, appStorage);
    wallet.initRpcIfEnabled();
    wallet.rpcEnabled().should.be.true();
    wallet.rpc.getInfo = () => new Promise((resolve, reject) => reject(new Error('fail')));
    await wallet.rpcReady().should.finally.be.false();
  });
  it('Wallet.blockchain()', function() {
    const wallet = new Wallet(token, conf, appStorage);
    wallet.blockchain().should.be.equal(token.blockchain);
  });
  it('Wallet.token()', function() {
    const wallet = new Wallet(token, conf, appStorage);
    wallet.token().should.be.eql(token);
  });
  it('Wallet.getBalance()', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const fakeUtxos = await fakerpc.listUnspent();
    const fakeBalance = [bignumber(0), bignumber(0)];
    for (const fakeUtxo of fakeUtxos) {
      fakeBalance[0] = (math.add(fakeBalance[0], bignumber(fakeUtxo.amount))).toFixed(8);
      fakeBalance[1] = (math.add(fakeBalance[1], bignumber(fakeUtxo.spendable ? fakeUtxo.amount : 0))).toFixed(8);
    }
    const balance = await wallet.getBalance();
    balance.should.be.eql(fakeBalance);
  });
  it('Wallet.getTransactions()', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const fakeTxs = await fakerpc.listTransactions();
    const txs = await wallet.getTransactions();
    txs.should.be.eql(fakeTxs);
  });
  it('Wallet.getTransactions() with timeframe', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const startTime = 1596654100;
    const endTime = 1596654200;
    const fakeTxs = await fakerpc.listTransactions(startTime, endTime);
    const txs = await wallet.getTransactions(startTime, endTime);
    txs.should.be.eql(fakeTxs);
  });
  it('Wallet.getTransactions() no transactions outside timeframe', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const startTime = 1596664100;
    const endTime = 1596664200;
    const txs = await wallet.getTransactions(startTime, endTime);
    txs.should.be.eql([]);
  });
  it('Wallet.getTransactions() timeframe with same start and end', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const startTime = 1596654100;
    const endTime = 1596654100;
    const fakeTxs = await fakerpc.listTransactions(startTime, endTime);
    const txs = await wallet.getTransactions(startTime, endTime);
    txs.should.be.eql(fakeTxs);
    txs.length.should.be.equal(1); // expecting only 1 transaction
  });
  it('Wallet.getTransactions() should filter only own addresses', async function() {
    const fakerpc = new FakeRPCController();
    fakerpc.getAddressesByAccount = async () => ["fakeaddress3", "fakeaddress4"];
    fakerpc.listTransactions = async () => {
      const data = [
        {"address": "fakeaddress3", "category": "receive", "amount": 50.00000000, "vout": 1, "fee": -0.00002250, "confirmations": 10280, "blockhash": "79b04e7945ceb0e72b16c2302277566e9c3b47fa45d122036871b9833789fc16", "blockindex": 5, "blocktime": 1596654098, "txid": "17dc2a8b2af2904dc388d23d2237e493a48f0da4752ebac4311a945785fd082b", "walletconflicts": [], "time": 1596654400, "timereceived": 1596654002, "bip125-replaceable": "no", "abandoned": false},
        {"address": "fakeaddress4", "category": "send", "amount": -50.00000000, "vout": 1, "fee": -0.00002250, "confirmations": 10280, "blockhash": "79b04e7945ceb0e72b16c2302277566e9c3b47fa45d122036871b9833789fc16", "blockindex": 5, "blocktime": 1596654098, "txid": "17dc2a8b2af2904dc388d23d2237e493a48f0da4752ebac4311a945785fd082b", "walletconflicts": [], "time": 1596654400, "timereceived": 1596654002, "bip125-replaceable": "no", "abandoned": false},
        {"address": "fakeaddress5", "category": "receive", "amount": 25.00000000, "vout": 1, "fee": -0.00002250, "confirmations": 10280, "blockhash": "79b04e7945ceb0e72b16c2302277566e9c3b47fa45d122036871b9833789fc16", "blockindex": 5, "blocktime": 1596654098, "txid": "17dc2a8b2af2904dc388d23d2237e493a48f0da4752ebac4311a945785fd082b", "walletconflicts": [], "time": 1596654400, "timereceived": 1596654002, "bip125-replaceable": "no", "abandoned": false},
      ];
      return data.map(t => new RPCTransaction({txId: t.txid, address: t.address, amount: t.amount, blockHash: t.blockhash, blockTime: t.blocktime, category: t.category, confirmations: t.confirmations, time: t.time, trusted: true}));
    };
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const fakeTxs = (await fakerpc.listTransactions()).filter(tx => tx.address !== 'fakeaddress5');
    const txs = await wallet.getTransactions();
    txs.should.be.eql(fakeTxs);
  });
  it('Wallet.getAddresses()', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const fakeAddrs = await fakerpc.getAddressesByAccount();
    const addrs = await wallet.getAddresses();
    addrs.should.be.eql(fakeAddrs);
  });
  it('Wallet.getAddresses() should pull from cache', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const addrs1 = await wallet.getAddresses();
    fakerpc.getAddressesByAccount = async () => ["fakeaddress3", "fakeaddress4"];
    const addrs2 = await wallet.getAddresses(60);
    addrs1.should.be.eql(addrs2);
  });
  it('Wallet.getAddresses() should expire', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    await wallet.getAddresses();
    const newAddrs = ["fakeaddress3", "fakeaddress4"];
    fakerpc.getAddressesByAccount = async () => newAddrs;
    const addrs = await wallet.getAddresses(0);
    addrs.should.be.eql(newAddrs);
  });
  it('Wallet.generateNewAddress()', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const fakeNewAddr = await fakerpc.getNewAddress();
    const addr = await wallet.generateNewAddress();
    addr.should.be.eql(fakeNewAddr);
  });
  it('Wallet.generateNewAddress() should expire fetch time', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    await wallet.getAddresses(); // sets fetch time
    wallet._cachedAddrs.fetchTime.should.be.greaterThan(0);
    await wallet.generateNewAddress();
    wallet._cachedAddrs.fetchTime.should.be.equal(0);
  });
  it('Wallet.getCachedUnspent()', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    (await wallet.getCachedUnspent(60)).should.be.eql(await fakerpc.listUnspent());
  });
  it('Wallet.getCachedUnspent() should return cache when not expired', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const utxo = new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 15.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 });
    wallet._cachedUtxos.fetchTime = unixTime() - 10;
    wallet._cachedUtxos.utxos = [utxo];
    (await wallet.getCachedUnspent(60)).should.be.eql([utxo]);
    wallet._cachedUtxos.fetchTime = unixTime() - 59;
    wallet._cachedUtxos.utxos = [utxo];
    (await wallet.getCachedUnspent(60)).should.be.eql([utxo]);
  });
  it('Wallet.getCachedUnspent() should not return cache when expired', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    const utxo = new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 15.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 });
    fakerpc.listUnspent = async () => [utxo];
    wallet.rpc = fakerpc;
    wallet._cachedUtxos.fetchTime = unixTime() - 100;
    wallet._cachedUtxos.utxos = [];
    (await wallet.getCachedUnspent(60)).should.be.eql([utxo]);
    wallet._cachedUtxos.fetchTime = unixTime() - 60;
    wallet._cachedUtxos.utxos = [];
    (await wallet.getCachedUnspent(60)).should.be.eql([utxo]);
  });
  it('Wallet.send() to one recipient should succeed', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 50, description: '' })];
    const txid = await wallet.send(recipients);
    should.exist(txid);
    txid.should.be.equal(await fakerpc.sendRawTransaction(''));
  });
  it('Wallet.send() to multiple recipients should succeed', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const recipients = [
      new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 50, description: '' }),
      new Recipient({ address: 'xw8FRKmDUkiM7cKRD7CQtJWTpUBLHcdNdv', amount: 25, description: '' }),
      new Recipient({ address: 'yK75ZDnqpgFraLBhLcrDcqt1iKLdT1egzs', amount: 15, description: '' }),
    ];
    const txid = await wallet.send(recipients);
    should.exist(txid);
    txid.should.be.equal(await fakerpc.sendRawTransaction(''));
  });
  it('Wallet.send() sending too much should fail', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const fakeUtxos = await wallet.rpc.listUnspent();
    const totalCoin = bignumber(fakeUtxos.map(fakeUtxo => fakeUtxo.amount)
      .reduce((acc, cur) => acc + cur)).toNumber().toFixed(8);
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: totalCoin + 10, description: '' })];
    const txid = await wallet.send(recipients);
    should.not.exist(txid);
  });
  it('Wallet.send() sending to bad recipients should fail', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    should.not.exist(await wallet.send([]));
    should.not.exist(await wallet.send(null));
    should.not.exist(await wallet.send(undefined));
    should.not.exist(await wallet.send([{}, {}]));
  });
  it('Wallet.send() with bad listUnspent rpc should fail', async function() {
    const fakerpc = new FakeRPCController();
    fakerpc.listUnspent = null;
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    should.not.exist(await wallet.send(recipients));
  });
  it('Wallet.send() with bad xbridge info should use default', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    wallet._token.xbinfo = null;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    await wallet.send(recipients).should.be.finally.String().and.not.be.equal('');
  });
  it('Wallet.send() with bad createRawTransaction rpc should fail', async function() {
    const fakerpc = new FakeRPCController();
    fakerpc.createRawTransaction = () => { throw new Error(''); };
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    should.not.exist(await wallet.send(recipients));
  });
  it('Wallet.send() with bad signRawTransaction rpc should fail', async function() {
    const fakerpc = new FakeRPCController();
    fakerpc.signRawTransaction = () => { throw new Error(''); };
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    should.not.exist(await wallet.send(recipients));
  });
  it('Wallet.send() with bad sendRawTransaction rpc should fail', async function() {
    const fakerpc = new FakeRPCController();
    fakerpc.sendRawTransaction = () => { throw new Error(''); };
    const wallet = new Wallet(token, conf, appStorage);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    should.not.exist(await wallet.send(recipients));
  });
  it('Wallet.getExplorerLink() will return the coin explorer link', () => {
    const wallet = new Wallet(token, conf, appStorage);
    const explorerLink = 'https://block-explorer.com/';
    wallet._explorerLink = explorerLink;
    wallet.getExplorerLink().should.equal(explorerLink);
  });
  it('Wallet.getExplorerLinkForTx() will return the link for a transaction in the explorer', () => {
    const wallet = new Wallet(token, conf, appStorage);
    const explorerTxLink = 'https://block-explorer.com/tx/';
    wallet._explorerTxLink = explorerTxLink + '{{tx}}';
    const tx = 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0';
    wallet.getExplorerLinkForTx(tx)
      .should.be.equal(explorerTxLink + tx);
  });
  it('Wallet.getExplorerLinkForTx() will return the general coin explorer link if an invalid transaction is passed in', () => {
    const wallet = new Wallet(token, conf, appStorage);
    const explorerLink = 'https://block-explorer.com/';
    wallet._explorerLink = explorerLink;
    const tx = 'some/thing/';
    wallet.getExplorerLinkForTx(tx)
      .should.be.equal(explorerLink);
  });
  it('Wallet.getWebsiteLink() will return the coin website link', () => {
    const wallet = new Wallet(token, conf, appStorage);
    const websiteLink = 'https://somecryptocurrency.com';
    wallet._websiteLink = websiteLink;
    wallet.getWebsiteLink().should.equal(websiteLink);
  });
});
