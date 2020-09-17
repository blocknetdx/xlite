import 'should';

import './rtests';
import Token from '../src/app/types/token';
import TokenManifest from '../src/app/modules/token-manifest';
import XBridgeInfo from '../src/app/types/xbridgeinfo';

describe('TokenManifest Test Suite', function() {
  const data = JSON.parse(`[{
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
  const blockToken = new Token(data[0]);
  const btcToken = new Token(data[1]);
  const feeBLOCK = new XBridgeInfo({ ticker: 'BLOCK', feeperbyte: 20, mintxfee: 10000, coin: 100000000 });
  const feeBTC = new XBridgeInfo({ ticker: 'BTC', feeperbyte: 120, mintxfee: 7500, coin: 100000000 });
  it('Token', () => {
    const tm = new TokenManifest(data, [feeBLOCK, feeBTC]);
    const token = tm.getToken('BLOCK');
    token.blockchain.should.be.a.String();
    token.ticker.should.be.a.String();
    token.ver_id.should.be.a.String();
    token.ver_name.should.be.a.String();
    token.conf_name.should.be.a.String();
    token.dir_name_linux.should.be.a.String();
    token.dir_name_mac.should.be.a.String();
    token.dir_name_win.should.be.a.String();
    token.repo_url.should.be.a.String();
    token.versions.should.be.an.Array();
    token.xbridge_conf.should.be.a.String();
    token.wallet_conf.should.be.a.String();
  });
  it('TokenManifest.getToken()', () => {
    const tm = new TokenManifest(data, [feeBLOCK, feeBTC]);
    const blockTokenCopy = blockToken;
    const btcTokenCopy = btcToken;
    blockTokenCopy.xbinfo = feeBLOCK;
    btcTokenCopy.xbinfo = feeBTC;
    tm.getToken('BLOCK').should.deepEqual(blockTokenCopy);
    tm.getToken('BTC').should.deepEqual(btcTokenCopy);
    should.not.exist(tm.getToken(''));
    should.not.exist(tm.getToken('BBLOCK'));
  });
  it('TokenManifest default BLOCK port', () => {
    const tm = new TokenManifest(data, [feeBLOCK, feeBTC]);
    tm.getToken('BLOCK').xbinfo.rpcport.should.be.equal(41419);
  });

});
