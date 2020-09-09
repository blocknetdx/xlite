import FakeRPCController from './fake-rpc-controller';
import RPCTransaction from '../src/app/types/rpc-transaction';
import {unixTime} from '../src/app/util';

export const resolvePromise = arg => new Promise((resolve, reject) => resolve(arg));

const otxBLOCK1 = {
  txId: '10913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
  address: 'yBMQcUYNZ2g177GTb77ZT6wWoknfqobBMJ',
  amount: '10.100000',
  blockHash: '1e37662083f6be532537663d2dc0d8f3a99af5ed4c68fb5d642325254294a017',
  blockTime: 1596654100,
  category: 'send',
  confirmations: 8865,
  time: 1596654100,
  trusted: true,
  hash: '10913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
  version: 1,
  size: 300,
  vSize: 300,
  vIn: [],
  vOut: [],
  hex: '01000000012c6f9f8c10cd5db62c01c591fd9e3736f42cec84ec59afea91fb7c0e503e20c8000000006a47304402203078ad70c8252be402f9f4d6e60e637528d648fb8dd0ebdfceaeb5ee03443eac02207536b8e8402b515ea495ad3b9e422aaa3f9c06fab34e0ec5a2a384aff5f3f87201210392b78bb64d3227c049ba3672a00f7ec300973b07581d88d972dbca0a727316bffeffffff021c3f1d0f6e0000001976a91419679b5b9d905671a2c0cd5798dde70d74cabc6388ac00f2052a010000001976a9149da5d5315113a53d7ff460e4011d455005b3acd988acebd60a00',
};
const otxBLOCK2 = {
  txId: '20913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
  address: 'yBMQcUYNZ2g177GTb77ZT6wWoknfqobBMJ',
  amount: '2.000000',
  blockHash: '1e37662083f6be532537663d2dc0d8f3a99af5ed4c68fb5d642325254294a017',
  blockTime: 1596654200,
  category: 'send',
  confirmations: 8865,
  time: 1596654200,
  trusted: true,
  hash: '10913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
  version: 1,
  size: 300,
  vSize: 300,
  vIn: [],
  vOut: [],
  hex: '01000000012c6f9f8c10cd5db62c01c591fd9e3736f42cec84ec59afea91fb7c0e503e20c8000000006a47304402203078ad70c8252be402f9f4d6e60e637528d648fb8dd0ebdfceaeb5ee03443eac02207536b8e8402b515ea495ad3b9e422aaa3f9c06fab34e0ec5a2a384aff5f3f87201210392b78bb64d3227c049ba3672a00f7ec300973b07581d88d972dbca0a727316bffeffffff021c3f1d0f6e0000001976a91419679b5b9d905671a2c0cd5798dde70d74cabc6388ac00f2052a010000001976a9149da5d5315113a53d7ff460e4011d455005b3acd988acebd60a00',
};
const otxBTC = {
  txId: '20913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
  address: '35x8RtuFsAnJCWEDQvJRDMi9Wa2k5Rs3Yp',
  amount: '1.12345678',
  blockHash: '2e37662083f6be532537663d2dc0d8f3a99af5ed4c68fb5d642325254294a017',
  blockTime: 1596660324,
  category: 'send',
  confirmations: 8865,
  time: 1596660284,
  trusted: true,
  hash: '20913b9adc6b95ac454d1f29f6d09e596cd638f3673bb889a506a6250a358bab',
  version: 1,
  size: 300,
  vSize: 300,
  vIn: [],
  vOut: [],
  hex: '01000000012c6f9f8c10cd5db62c01c591fd9e3736f42cec84ec59afea91fb7c0e503e20c8000000006a47304402203078ad70c8252be402f9f4d6e60e637528d648fb8dd0ebdfceaeb5ee03443eac02207536b8e8402b515ea495ad3b9e422aaa3f9c06fab34e0ec5a2a384aff5f3f87201210392b78bb64d3227c049ba3672a00f7ec300973b07581d88d972dbca0a727316bffeffffff021c3f1d0f6e0000001976a91419679b5b9d905671a2c0cd5798dde70d74cabc6388ac00f2052a010000001976a9149da5d5315113a53d7ff460e4011d455005b3acd988acebd60a00',
};
export const txBLOCK = new RPCTransaction(otxBLOCK1);
export const txBTC = new RPCTransaction(otxBTC);

const fakeRpc = new FakeRPCController();
const FakeApi = (fakeApi) => {
  if (!fakeApi)
    fakeApi = {};
  Object.assign(fakeApi, {
    isDev: true,
    walletController_getWallets: () => resolvePromise([
      {"ticker": "BLOCK", "name": "Blocknet", "imagePath": "images/coins/icon-block.png, images/coins/icon-block@2x.png 2x"},
      {"ticker": "BTC", "name": "Bitcoin", "imagePath": "images/coins/icon-btc.png, images/coins/icon-btc@2x.png 2x"}]),
    walletController_getWallet: async (ticker) => (await fakeApi.walletController_getWallets()).find(t => t.ticker === ticker),
    walletController_getEnabledWallets: () => fakeApi.walletController_getWallets(),
    walletController_getBalances: () => resolvePromise(new Map([["BLOCK", ["0.39927277", "0.39927277"]], ["BTC", ["0.21000000", "0.21000000"]]])),
    walletController_getCurrencyMultipliers: () => resolvePromise('{"BCH":{"USD":222.18,"BTC":0.02215,"EUR":189.06,"GBP":193.8},"BLOCK":{"USD":0.8948,"BTC":0.0000892,"EUR":0.7609,"GBP":0.6904},"BTC":{"USD":10030.75,"BTC":1,"EUR":8530.25,"GBP":7739.5},"DASH":{"USD":72.48,"BTC":0.007228,"EUR":61.1,"GBP":55.94},"DGB":{"USD":0.02106,"BTC":0.0000021,"EUR":0.01792,"GBP":0.01625},"DOGE":{"USD":0.00266,"BTC":2.7e-7,"EUR":0.002313,"GBP":0.00209},"LTC":{"USD":47.41,"BTC":0.004725,"EUR":40.35,"GBP":41.25},"PHR":{"USD":0.0008025,"BTC":8e-8,"EUR":0.0006825,"GBP":0.0006192},"PIVX":{"USD":0.3868,"BTC":0.00003854,"EUR":0.326,"GBP":0.2985},"POLIS":{"USD":0.5686,"BTC":0.00005669,"EUR":0.4836,"GBP":0.4388},"RVN":{"USD":0.01635,"BTC":0.00000163,"EUR":0.0139,"GBP":0.01262},"SYS":{"USD":0.06219,"BTC":0.0000062,"EUR":0.05288,"GBP":0.04798}}'),
    walletController_loadWallets: () => resolvePromise(true),
    walletController_updatePriceMultipliers: () => resolvePromise(true),
    walletController_updateBalanceInfo: (ticker) => resolvePromise(true),
    walletController_updateAllBalances: () => resolvePromise(true),
    wallet_getTransactions: (ticker, startTime=0, endTime=0) => {
      if (endTime === 0)
        endTime = unixTime();
      const blockTxs = [otxBLOCK1, otxBLOCK2];
      const btcTxs = [otxBTC];
      if (ticker === 'BLOCK')
        return resolvePromise(blockTxs.filter(tx => tx.time >= startTime && tx.time <= endTime));
      else if (ticker === 'BTC')
        return resolvePromise(btcTxs.filter(tx => tx.time >= startTime && tx.time <= endTime));
      else
        return resolvePromise(null);
    },
    wallet_rpcEnabled: (ticker) => resolvePromise(true),
    wallet_getBalance: async (ticker) => resolvePromise((await fakeApi.walletController_getBalances()).get(ticker)),
    wallet_getAddresses: (ticker) => resolvePromise(['address1','address2','address3','address4']),
    wallet_generateNewAddress: (ticker) => resolvePromise('address' + Math.random()),
    wallet_getCachedUnspent: async (ticker) => resolvePromise(await fakeRpc.listUnspent()),
    wallet_send: (ticker) => resolvePromise('txid_for_sent_tx'),
  });
  return fakeApi;
};

export default FakeApi;
