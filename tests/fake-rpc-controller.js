import RPCBlock from '../src/app/types/rpc-block';
import RPCBlockchainInfo from '../src/app/types/rpc-blockchain-info';
import RPCInfo from '../src/app/types/rpc-info';
import RPCNetworkInfo from '../src/app/types/rpc-network-info';
import RPCUnspent from '../src/app/types/rpc-unspent';
import RPCSignedRawTransaction from '../src/app/types/rpc-signed-raw-transaction';
import RPCTransaction from '../src/app/types/rpc-transaction';
import RPCTransactionOutput from '../src/app/types/rpc-transaction-output';
import {unixTime} from '../src/app/util';

/**
 * Used in unit tests
 */
class FakeRPCController {
  _port = 41414;
  _username = 'testuser';
  _password = 'test';

  constructor() {
  }

  isNull() {
    return this._port <= 1024;
  }

  async getTxOut(txId, vOut) {
    return new RPCTransactionOutput({
      confirmations: 100,
      value: 100.0,
      scriptPubKey: {
        "asm": "OP_DUP OP_HASH160 d3427d3fd87a72d52da240909cf92ca1084a50c9 OP_EQUALVERIFY OP_CHECKSIG",
        "hex": "76a914d3427d3fd87a72d52da240909cf92ca1084a50c988ac",
        "reqSigs": 1,
        "type": "pubkeyhash",
        "addresses": [
          "Bo3iq48VPnSrpp6X4tq5ynxUZLpLAXA6FA"
        ]
      },
      coinbase: false
    });
  }

  async getInfo() {
    return new RPCInfo({
      protocolVersion: 70713,
      ticker: 'BLOCK',
      balance: 1000.0,
      testnet: false,
      difficulty: 20000,
      connections: 1,
      blocks: 1579746,
      keyPoolSize: 0,
      keyPoolOldest: 0,
      relayFee: 0.0001,
      networkActive: true,
      timeOffest: 1597270555
    });
  }

  async getNetworkInfo() {
    return new RPCNetworkInfo({
      protocolVersion: 70713,
      ticker: 'BLOCK',
      subversion: '/Blocknet 4.3.1/',
      connections: 1,
      localServices: '0',
      relayFee: 0.0001
    });
  }

  async getRawMempool() {
    return [
      "aa9ce7adaa4f2ae0546b8610c3c4da2c2290787761744633c1d1465c265c704d",
      "0c0466b7ced37291d128db1994a2ce2fcd63ee9d745f3c065ed8a344f80c78a4",
      "0663d8b8f0ee81b82a9c79ca8f2e9050393a819f71d47b81e3bdb85934ad9c53",
    ];
  }

  async getBlockchainInfo() {
    return new RPCBlockchainInfo({
      chain: 'mainnet',
      blocks: 1579746,
      headers: 1579746,
      verificationProgress: 1,
      difficulty: 20000,
      initialBlockDownload: false,
      pruned: false
    });
  }

  async getBlockHash(height) {
    return '26a1ad716eb18532d473f192f10a34cdc28d2cc767a4eb933341c7fa89ca22d6';
  }

  async getBlock(hash) {
    return new RPCBlock({
      hash: '26a1ad716eb18532d473f192f10a34cdc28d2cc767a4eb933341c7fa89ca22d6',
      confirmations: 100,
      strippedSize: 540,
      size: 576,
      weight: 2196,
      height: 1579743,
      version: 536870912,
      versionHex: '0x0',
      merkleRoot: '1234170f68c90ebd702ec765d19ebdbe76d866300a36586358f9b108c5f297fe',
      tx: ["aa9ce7adaa4f2ae0546b8610c3c4da2c2290787761744633c1d1465c265c704d",
        "0c0466b7ced37291d128db1994a2ce2fcd63ee9d745f3c065ed8a344f80c78a4"],
      time: 1597270555,
      medianTime: 1597270212,
      nonce: 1597270568,
      bits: '1b05aba4',
      difficulty: 11557.240622141,
      chainWork: '0000000000000000000000000000000000000000000000058715dfec96f3e54b',
      previousBlockHash: 'e2e85e3c73201ce9fca941fd9f7f73f24de9259e9e62e002430e7f9edbdb204b',
      nextBlockHash: ''
    });
  }

  async listUnspent() {
    const data = [
      {
        "txid": "bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611",
        "vout": 0,
        "address": "yDMj8jsLQpwim9dAXaV9VmuaguNBUYoL5p",
        "scriptPubKey": "76a914b3a58baa6dd080ce7547756cd52d937dd9f9562788ac",
        "amount": 4859.99991000,
        "confirmations": 10283,
        "spendable": true,
        "solvable": true,
        "desc": "pkh([b3a58baa]028bfc411c843728f7d51bf002d14488e1995788ac0c2306113954a5566442630a)#qa403ntp",
        "safe": true
      },
      {
        "txid": "4b0e09bde9cae5747649816f6256cbc8bf96719be3f548467a7893dc72d27557",
        "vout": 0,
        "address": "yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt",
        "scriptPubKey": "76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac",
        "amount": 4909.99993250,
        "confirmations": 10283,
        "spendable": true,
        "solvable": true,
        "desc": "pkh([fef1b70a]037d640bb246112e813f371ee966f2a7f09e6f06a474eb7eee7d65daac4b165266)#32qc3298",
        "safe": true
      },
      {
        "txid": "f6859439281295d2a05c120b9b5cec5b934d17bf30bf4856704022430a89c05a",
        "vout": 1,
        "address": "y3ahFWHp2MGkXktiMSaAwoVm3HWnxWhaeD",
        "scriptPubKey": "76a91448681f833b76380857d79976070da8945297efe488ac",
        "amount": 0.95072610,
        "confirmations": 25832,
        "spendable": true,
        "solvable": true,
        "desc": "pkh([48681f83]03770ee8fc5625cf128c325774eec09ba0fb242bf229b2ff227c34e15b64136a38)#y40ahqhz",
        "safe": true
      },
      {
        "txid": "2c90a5ff6fb0a4a32f791b820d3461cd168550b9f80815d1d5a4554eab5b90aa",
        "vout": 1,
        "address": "yKSNcTbCZwc8SAxUG7dNvLjUrCqueSojHJ",
        "scriptPubKey": "76a914f6573fc5bc65f482c526513b1db28a10d71f004288ac",
        "amount": 4909.99993250,
        "confirmations": 10283,
        "spendable": true,
        "solvable": true,
        "desc": "pkh([f6573fc5]032aed3169c100255d16a1c86d0335d6e5cdd6fa4b2b41478108302832cc02df9d)#52u86uc2",
        "safe": true
      },
      {
        "txid": "50913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab",
        "vout": 0,
        "address": "y6LfPJi1aGAEkWdhovuhjYvLcjq1sGdomy",
        "scriptPubKey": "76a91466a91ea6b7468b77e4676fd8f59466ee66bcf63388ac",
        "amount": 4706.99973040,
        "confirmations": 10179,
        "spendable": true,
        "solvable": true,
        "desc": "pkh([66a91ea6]03c18171589bdf37f8e9f84f4d9ee629514019706d55eeff44d0b9248e478378d9)#kusdvj0m",
        "safe": true
      },
      {
        "txid": "b0fa8f367e14b775ebcca5321769ae9b9fecf8ac2049cf22f7557485ea43d8bd",
        "vout": 0,
        "address": "xzQ141377nK3hmcdcYP3WV3tELKEzfXa67",
        "scriptPubKey": "76a914257a07bd5d5be84b80b3613b9c44136d4853374288ac",
        "amount": 4859.99991000,
        "confirmations": 10283,
        "spendable": true,
        "solvable": true,
        "desc": "pkh([257a07bd]03756d9aa7e21cfc5d242cb9e63c775ed1d4c7d78cc70642a6aca6b399562e85a2)#fmah4p8m",
        "safe": true
      }
    ];
    return data.map(t => new RPCUnspent({
      txId: t.txid,
      vOut: t.vout,
      address: t.address,
      amount: t.amount,
      scriptPubKey: t.scriptPubKey,
      spendable: t.spendable,
      confirmations: t.confirmations
    }));
  }

  async getNewAddress() {
    return 'yHaCKafYDFciZPA54UjcSvwiiikG6S7Xhf';
  }

  async getTransaction(txId) {
    return new RPCTransaction({
      txId: '0c0466b7ced37291d128db1994a2ce2fcd63ee9d745f3c065ed8a344f80c78a4',
      hash: '0c0466b7ced37291d128db1994a2ce2fcd63ee9d745f3c065ed8a344f80c78a4',
      version: 1,
      size: 200,
      vSize: 200,
      lockTime: 0,
      vIn: [{
        "txid": "0663d8b8f0ee81b82a9c79ca8f2e9050393a819f71d47b81e3bdb85934ad9c53",
        "vout": 1,
        "scriptSig": {
          "asm": "30440220168b2af356eed7e40ed8a47e21b7c647fe01d8ea83458836216c95acf1a60edc02200a8bbe99593465d6f021a10848913050cddec1091ea6c5390405edc4a88ee6a2[ALL] 02f8896a652661cd6d9958dc84ee013d212412bcdb2311ff3329977e9945757e7e",
          "hex": "4730440220168b2af356eed7e40ed8a47e21b7c647fe01d8ea83458836216c95acf1a60edc02200a8bbe99593465d6f021a10848913050cddec1091ea6c5390405edc4a88ee6a2012102f8896a652661cd6d9958dc84ee013d212412bcdb2311ff3329977e9945757e7e"
        },
        "sequence": 4294967295
      }],
      vOut: [{
        "value": 0,
        "n": 0,
        "scriptPubKey": {
          "asm": "",
          "hex": "",
          "type": "nonstandard"
        }
      },
      {
        "value": 2576.00451743,
        "n": 1,
        "scriptPubKey": {
          "asm": "OP_DUP OP_HASH160 d3427d3fd87a72d52da240909cf92ca1084a50c9 OP_EQUALVERIFY OP_CHECKSIG",
          "hex": "76a914d3427d3fd87a72d52da240909cf92ca1084a50c988ac",
          "reqSigs": 1,
          "type": "pubkeyhash",
          "addresses": [
            "Bo3iq48VPnSrpp6X4tq5ynxUZLpLAXA6FA"
          ]
        }
      }],
      hex: '0100000001539cad3459b8bde3817bd4719f813a3950902e8fca799c2ab881eef0b8d86306010000006a4730440220168b2af356eed7e40ed8a47e21b7c647fe01d8ea83458836216c95acf1a60edc02200a8bbe99593465d6f021a10848913050cddec1091ea6c5390405edc4a88ee6a2012102f8896a652661cd6d9958dc84ee013d212412bcdb2311ff3329977e9945757e7effffffff020000000000000000009ff42efa3b0000001976a914d3427d3fd87a72d52da240909cf92ca1084a50c988ac00000000',
      blockHash: '26a1ad716eb18532d473f192f10a34cdc28d2cc767a4eb933341c7fa89ca22d6',
      confirmations: 100,
      time: 1597270555,
      blockTime: 1597270555
    });
  }

  async getAddressesByAccount(account = 'main') {
    return ["fakeaddress1", "fakeaddress2"];
  }

  async importPrivKey(privKey) {
    return true;
  }

  async dumpPrivKey(address) {
    return 'cQ6SR5obr9dFkJumWu5RfVGWNHhacEuC2JDoY7pe5WatQt9FJJwj';
  }

  async signMessage(address, message) {
    return 'H7Jd/YyJ0zSR1fP4igOpX3wS+zF810U9SHe8VkLUQhYCZkITaXgOWZhylYwjTqC2ZkNtmPMKk8iKuvJvyor08KA=';
  }

  async verifyMessage(address, signature, message) {
    return true;
  }

  async createRawTransaction(inputs, outputs = {}) {
    return '0100000001539cad3459b8bde3817bd4719f813a3950902e8fca799c2ab881eef0b8d86306010000006a4730440220168b2af356eed7e40ed8a47e21b7c647fe01d8ea83458836216c95acf1a60edc02200a8bbe99593465d6f021a10848913050cddec1091ea6c5390405edc4a88ee6a2012102f8896a652661cd6d9958dc84ee013d212412bcdb2311ff3329977e9945757e7effffffff020000000000000000009ff42efa3b0000001976a914d3427d3fd87a72d52da240909cf92ca1084a50c988ac00000000';
  }

  async decodeRawTransaction(rawTx) {
    return new RPCTransaction({
      txId: '0c0466b7ced37291d128db1994a2ce2fcd63ee9d745f3c065ed8a344f80c78a4',
      version: 1,
      lockTime: 0,
      vIn: [{
        "txid": "0663d8b8f0ee81b82a9c79ca8f2e9050393a819f71d47b81e3bdb85934ad9c53",
        "vout": 1,
        "scriptSig": {
          "asm": "30440220168b2af356eed7e40ed8a47e21b7c647fe01d8ea83458836216c95acf1a60edc02200a8bbe99593465d6f021a10848913050cddec1091ea6c5390405edc4a88ee6a2[ALL] 02f8896a652661cd6d9958dc84ee013d212412bcdb2311ff3329977e9945757e7e",
          "hex": "4730440220168b2af356eed7e40ed8a47e21b7c647fe01d8ea83458836216c95acf1a60edc02200a8bbe99593465d6f021a10848913050cddec1091ea6c5390405edc4a88ee6a2012102f8896a652661cd6d9958dc84ee013d212412bcdb2311ff3329977e9945757e7e"
        },
        "sequence": 4294967295
      }],
      vOut: [{
        "value": 0.00000000,
        "n": 0,
        "scriptPubKey": {
          "asm": "",
          "hex": "",
          "type": "nonstandard"
        }
      },
      {
        "value": 2576.00451743,
        "n": 1,
        "scriptPubKey": {
          "asm": "OP_DUP OP_HASH160 d3427d3fd87a72d52da240909cf92ca1084a50c9 OP_EQUALVERIFY OP_CHECKSIG",
          "hex": "76a914d3427d3fd87a72d52da240909cf92ca1084a50c988ac",
          "reqSigs": 1,
          "type": "pubkeyhash",
          "addresses": [
            "Bo3iq48VPnSrpp6X4tq5ynxUZLpLAXA6FA"
          ]
        }
      }]
    });
  }

  async signRawTransaction(rawTx) {
    return new RPCSignedRawTransaction({
      hex: '0100000001539cad3459b8bde3817bd4719f813a3950902e8fca799c2ab881eef0b8d86306010000006a4730440220168b2af356eed7e40ed8a47e21b7c647fe01d8ea83458836216c95acf1a60edc02200a8bbe99593465d6f021a10848913050cddec1091ea6c5390405edc4a88ee6a2012102f8896a652661cd6d9958dc84ee013d212412bcdb2311ff3329977e9945757e7effffffff020000000000000000009ff42efa3b0000001976a914d3427d3fd87a72d52da240909cf92ca1084a50c988ac00000000',
      complete: true
    });
  }

  async sendRawTransaction(signedRawTransaction) {
    return '0c0466b7ced37291d128db1994a2ce2fcd63ee9d745f3c065ed8a344f80c78a4';
  }

  async listTransactions(startTime=0, endTime=0) {
    if (endTime === 0)
      endTime = unixTime();
    const data = [{
      "address": "yBMQcUYNZ2g177GTb77ZT6wWoknfqobBMJ",
      "category": "send",
      "amount": -50.00000000,
      "vout": 1,
      "fee": -0.00002250,
      "confirmations": 10280,
      "blockhash": "79b04e7945ceb0e72b16c2302277566e9c3b47fa45d122036871b9833789fc16",
      "blockindex": 4,
      "blocktime": 1596654098,
      "txid": "c8203e500e7cfb91eaaf59ec84ec2cf436379efd91c5012cb65dcd108c9f6f2c",
      "walletconflicts": [],
      "time": 1596654100,
      "timereceived": 1596654000,
      "bip125-replaceable": "no",
      "abandoned": false
    },
    {
      "address": "yBMQcUYNZ2g177GTb77ZT6wWoknfqobBMJ",
      "category": "send",
      "amount": -50.00000000,
      "vout": 1,
      "fee": -0.00002250,
      "confirmations": 10280,
      "blockhash": "79b04e7945ceb0e72b16c2302277566e9c3b47fa45d122036871b9833789fc16",
      "blockindex": 9,
      "blocktime": 1596654098,
      "txid": "b0fa8f367e14b775ebcca5321769ae9b9fecf8ac2049cf22f7557485ea43d8bd",
      "walletconflicts": [],
      "time": 1596654200,
      "timereceived": 1596654000,
      "bip125-replaceable": "no",
      "abandoned": false
    },
    {
      "address": "yBMQcUYNZ2g177GTb77ZT6wWoknfqobBMJ",
      "category": "send",
      "amount": -50.00000000,
      "vout": 1,
      "fee": -0.00002250,
      "confirmations": 10280,
      "blockhash": "79b04e7945ceb0e72b16c2302277566e9c3b47fa45d122036871b9833789fc16",
      "blockindex": 2,
      "blocktime": 1596654098,
      "txid": "bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611",
      "walletconflicts": [],
      "time": 1596654301,
      "timereceived": 1596654001,
      "bip125-replaceable": "no",
      "abandoned": false
    },
    {
      "address": "yBMQcUYNZ2g177GTb77ZT6wWoknfqobBMJ",
      "category": "send",
      "amount": -50.00000000,
      "vout": 1,
      "fee": -0.00002250,
      "confirmations": 10280,
      "blockhash": "79b04e7945ceb0e72b16c2302277566e9c3b47fa45d122036871b9833789fc16",
      "blockindex": 5,
      "blocktime": 1596654098,
      "txid": "17dc2a8b2af2904dc388d23d2237e493a48f0da4752ebac4311a945785fd082b",
      "walletconflicts": [],
      "time": 1596654400,
      "timereceived": 1596654002,
      "bip125-replaceable": "no",
      "abandoned": false
    }];
    return data.map(t => new RPCTransaction({
        txId: t.txid,
        address: t.address,
        amount: t.amount,
        blockHash: t.blockhash,
        blockTime: t.blocktime,
        category: t.category,
        confirmations: t.confirmations,
        time: t.time,
        trusted: true
      }))
      .filter(t => t.time >= startTime && t.time <= endTime);
  }

  /**
   * Call the CloudChains RPC help method.
   * @return {Promise<Object>}
   */
  async ccHelp() {
    return 'Some help text';
  }
}

export default FakeRPCController;
