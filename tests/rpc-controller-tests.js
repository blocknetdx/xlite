/* global describe, it */
/* TODO RPCController tests should not rely on cli availability
import 'should';
import RPCController from '../src/server/modules/rpc-controller';
import RPCInfo from '../src/app/types/rpc-info';
import RPCNetworkInfo from '../src/app/types/rpc-network-info';
import RPCBlockchainInfo from '../src/app/types/rpc-blockchain-info';
import RPCBlock from '../src/app/types/rpc-block';
import RPCUnspent from '../src/app/types/rpc-unspent';
import RPCTransactionOutput from '../src/app/types/rpc-transaction-output';
import RPCTransaction from '../src/app/types/rpc-transaction';
import RPCSignedRawTransaction from '../src/app/types/rpc-signed-raw-transaction';

const { username, password, port } = process.env;

if(!username || !password || !port) throw new Error('You need username, password, and port environmental variables for an active RPC server in order to test this module.');
describe('RPCController', function() {

  const rpc = new RPCController(Number(port), username, password);

  it('should be a constructor', function() {
    RPCController.should.be.a.Function();
    rpc.should.be.an.instanceOf(RPCController);
  });

  describe('an RPCController instance', function() {

    it('should have a getInfo method', function() {
      rpc.getInfo.should.be.a.Function();
      describe('the getInfo method', async function() {
        it('should return an RPCInfo instance', async function() {
          const res = await rpc.getInfo();
          res.should.be.an.instanceOf(RPCInfo);
        });
      });
    });

    it('should have a getNetworkInfo method', function() {
      rpc.getNetworkInfo.should.be.a.Function();
      describe('the getNetworkInfo method', async function() {
        it('should return an RPCNetworkInfo instance', async function() {
          const res = await rpc.getNetworkInfo();
          res.should.be.an.instanceOf(RPCNetworkInfo);
        });
      });
    });

    it('should have a getRawMempool method', function() {
      rpc.getRawMempool.should.be.a.Function();
      describe('the getRawMempool method', async function() {
        it('should return an array of strings', async function() {
          const res = await rpc.getRawMempool();
          res.should.be.an.Array();
          for(const str of res) {
            str.should.be.a.String();
          }
        });
      });
    });

    it('should have a getBlockchainInfo method', function() {
      rpc.getBlockchainInfo.should.be.a.Function();
      describe('the getBlockchainInfo method', async function() {
        it('should return an RPCBlockchainInfo instance', async function() {
          const res = await rpc.getBlockchainInfo();
          res.should.be.an.instanceOf(RPCBlockchainInfo);
        });
      });
    });

    const blockHeight = 1000;
    let blockHash;

    it('should have a getBlockHash method', function() {
      rpc.getBlockHash.should.be.a.Function();
      describe('the getBlockHash method', async function() {
        it('should return a string', async function() {
          const res = await rpc.getBlockHash(blockHeight);
          res.should.be.a.String();
          blockHash = res;
        });
      });
    });

    let tx;

    it('should have a getBlock method', function() {
      rpc.getBlock.should.be.a.Function();
      describe('the getBlock method', async function() {
        it('should return an RPCBlock instance', async function() {
          const res = await rpc.getBlock(blockHash);
          res.height.should.equal(blockHeight);
          res.should.be.an.instanceOf(RPCBlock);
          tx = res.tx[0];
        });
      });
    });

    let txId, vOut, unspent;

    it('should have a listUnspent method', function() {
      rpc.listUnspent.should.be.a.Function();
      describe('the listUnspent method', async function() {
        it('should return an array of RPCUnspent instances', async function() {
          const res = await rpc.listUnspent();
          res.should.be.an.Array();
          for(const obj of res) {
            obj.should.be.an.instanceOf(RPCUnspent);
            txId = obj.txId;
            vOut = obj.vOut;
          }
          unspent = res;
        });
      });
    });

    it('should have a getTxOut method', function() {
      rpc.getTxOut.should.be.a.Function();
      describe('the getTxOut method', async function() {
        it('should return an RPCTransactionOutput instance', async function() {
          if(txId) {
            const res = await rpc.getTxOut(txId, vOut);
            res.should.be.an.instanceOf(RPCTransactionOutput);
          }
        });
      });
    });

    it('should have a getNewAddress method', function() {
      rpc.getNewAddress.should.be.a.Function();
      describe('the getNewAddress method', async function() {
        it('should return an address', async function() {
          const res = await rpc.getNewAddress();
          res.should.be.a.String();
        });
      });
    });

    it('should have a getTransaction method', function() {
      rpc.getTransaction.should.be.a.Function();
      describe('the getTransaction method', async function() {
        it('should return a RPCTransaction instance', async function() {
          const res = await rpc.getTransaction(tx);
          res.should.be.an.instanceOf(RPCTransaction);
        });
      });
    });

    let addresses;

    it('should have a getAddressesByAccount method', function() {
      rpc.getAddressesByAccount.should.be.a.Function();
      describe('the getAddressesByAccount method', async function() {
        it('should return an array of address strings', async function() {
          const res = await rpc.getAddressesByAccount('main');
          res.should.be.an.Array();
          for(const str of res) {
            str.should.be.a.String();
          }
          addresses = res;
        });
      });
    });

    let privKey;

    it('should have a dumpPrivKey method', function() {
      rpc.dumpPrivKey.should.be.a.Function();
      describe('the dumpPrivKey method', async function() {
        it('should return a private key string', async function() {
          const res = await rpc.dumpPrivKey(addresses[0]);
          res.should.be.a.String();
          privKey = res;
        });
      });
    });

    it('should have an importPrivKey method', function() {
      rpc.importPrivKey.should.be.a.Function();
      describe('the importPrivKey method', async function() {
        it('should return a string', async function() {
          const res = await rpc.importPrivKey(privKey);
          res.should.be.a.String();
        });
      });
    });

    const message = 'something';
    let signature;

    it('should have an signMessage method', function() {
      rpc.signMessage.should.be.a.Function();
      describe('the signMessage method', async function() {
        it('should return a signature string', async function() {
          const res = await rpc.signMessage(addresses[0], message);
          res.should.be.a.String();
          signature = res;
        });
      });
    });

    it('should have a verifyMessage method', function() {
      rpc.verifyMessage.should.be.a.Function();
      describe('the verifyMessage method', async function() {
        it('should return a boolean', async function() {
          const res = await rpc.verifyMessage(addresses[0], signature, message);
          res.should.be.a.Boolean();
          res.should.equal(true);
        });
      });
    });

    let rawTransaction;

    it('should have a createRawTransaction method', function() {
      rpc.createRawTransaction.should.be.a.Function();
      describe('the createRawTransaction method', async function() {
        it('should return an encoded transaction string', async function() {
          const address = addresses.find(a => unspent.every(u => u.address !== a));
          const inputs = unspent
            .filter(u => u.spendable);
          const amount = inputs
            .reduce((total, i) => total + i.amount, 0) / 2;
          const res = await rpc.createRawTransaction(inputs, {[address]: amount});
          res.should.be.a.String();
          rawTransaction = res;
        });
      });
    });

    it('should have a decodeRawTransaction method', function() {
      rpc.decodeRawTransaction.should.be.a.Function();
      describe('the decodeRawTransaction method', async function() {
        it('should return an RPCTransaction instance', async function() {
          const res = await rpc.decodeRawTransaction(rawTransaction);
          res.should.be.an.instanceOf(RPCTransaction);
        });
      });
    });

    let signedRawTransaction;

    it('should have a signRawTransaction method', function() {
      rpc.signRawTransaction.should.be.a.Function();
      describe('the signRawTransaction method', async function() {
        it('should return a RPCSignedRawTransaction instance', async function() {
          const res = await rpc.signRawTransaction(rawTransaction);
          res.should.be.an.instanceOf(RPCSignedRawTransaction);
          signedRawTransaction = res;
        });
      });
    });

    it('should have a sendRawTransaction method', function() {
      rpc.sendRawTransaction.should.be.a.Function();
      describe('the sendRawTransaction method', async function() {
        it('should return a transaction hash string', async function() {
          const res = await rpc.sendRawTransaction(signedRawTransaction);
          res.should.be.a.String();
        });
      });
    });

  });

});
*/
