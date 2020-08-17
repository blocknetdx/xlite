import 'should';
import {all, create} from 'mathjs';
const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

import CCWalletConf from '../src/app/types/ccwalletconf';
import FakeRPCController from './fake-rpc-controller';
import FeeInfo from '../src/app/types/feeinfo';
import Recipient from '../src/app/types/recipient';
import RPCController from '../src/app/modules/rpc-controller';
import Token from '../src/app/types/token';
import Wallet from '../src/app/types/wallet';

describe('Wallet Test Suite', function() {
  let token;
  let conf;
  beforeEach(function() {
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
    token.feeinfo = new FeeInfo({ ticker: 'BLOCK', feeperbyte: 20, mintxfee: 10000, coin: 100000000 });
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
    const wallet = new Wallet(token, conf);
    wallet._token.should.be.eql(token);
    wallet._conf.should.be.eql(conf);
    wallet.ticker.should.be.equal(token.ticker);
    wallet.ticker.should.be.equal(conf.ticker());
    wallet.name.should.be.equal(token.blockchain);
    wallet.imagePath.should.be.equal(Wallet.getImage(wallet.ticker));
    wallet.rpcEnabled().should.be.true();
    wallet.rpc.should.be.eql(new RPCController(41414, 'testUser', 'test'));
  });
  it('Wallet.rpcEnabled() Wallet.initRpcIfEnabled()', function() {
    const wallet = new Wallet(token, conf);
    wallet.initRpcIfEnabled();
    wallet.rpcEnabled().should.be.true();
    wallet.rpc.should.be.eql(new RPCController(41414, 'testUser', 'test'));
    conf.rpcEnabled = false;
    const wallet2 = new Wallet(token, conf);
    wallet2.initRpcIfEnabled();
    wallet2.rpcEnabled().should.be.false();
    wallet2.rpc.should.be.eql(new RPCController(0, '', ''));
  });
  it('Wallet.getBalance()', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf);
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
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    const fakeTxs = await fakerpc.listTransactions();
    const txs = await wallet.getTransactions();
    txs.should.be.eql(fakeTxs);
  });
  it('Wallet.getAddresses()', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    const fakeAddrs = await fakerpc.getAddressesByAccount();
    const addrs = await wallet.getAddresses();
    addrs.should.be.eql(fakeAddrs);
  });
  it('Wallet.generateNewAddress()', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    const fakeNewAddr = await fakerpc.getNewAddress();
    const addr = await wallet.generateNewAddress();
    addr.should.be.eql(fakeNewAddr);
  });
  it('Wallet.send() to one recipient should succeed', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 50, description: '' })];
    const txid = await wallet.send(recipients);
    should.exist(txid);
    txid.should.be.equal(await fakerpc.sendRawTransaction(''));
  });
  it('Wallet.send() to multiple recipients should succeed', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf);
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
    const wallet = new Wallet(token, conf);
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
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    should.not.exist(await wallet.send([]));
    should.not.exist(await wallet.send(null));
    should.not.exist(await wallet.send(undefined));
    should.not.exist(await wallet.send([{}, {}]));
  });
  it('Wallet.send() with bad listUnspent rpc should fail', async function() {
    const fakerpc = new FakeRPCController();
    fakerpc.listUnspent = null;
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    should.not.exist(await wallet.send(recipients));
  });
  it('Wallet.send() with bad fee info should use default', async function() {
    const fakerpc = new FakeRPCController();
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    wallet._token.feeinfo = null;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    await wallet.send(recipients).should.be.finally.String().and.not.be.equal('');
  });
  it('Wallet.send() with bad createRawTransaction rpc should fail', async function() {
    const fakerpc = new FakeRPCController();
    fakerpc.createRawTransaction = () => { throw new Error(''); };
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    should.not.exist(await wallet.send(recipients));
  });
  it('Wallet.send() with bad signRawTransaction rpc should fail', async function() {
    const fakerpc = new FakeRPCController();
    fakerpc.signRawTransaction = () => { throw new Error(''); };
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    should.not.exist(await wallet.send(recipients));
  });
  it('Wallet.send() with bad sendRawTransaction rpc should fail', async function() {
    const fakerpc = new FakeRPCController();
    fakerpc.sendRawTransaction = () => { throw new Error(''); };
    const wallet = new Wallet(token, conf);
    wallet.rpc = fakerpc;
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    should.not.exist(await wallet.send(recipients));
  });
});
