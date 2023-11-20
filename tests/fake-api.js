/*eslint quotes: 0, key-spacing: 0*/
import FakeRPCController from './fake-rpc-controller';
import PriceData from '../src/app/types/pricedata';
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
  txId: 'eb762a3e7802d72b0a5e78e4c2cbd6dd29d6ff3f9c1095d47ff9d02909cdc5ee',
  address: 'yBMQcUYNZ2g177GTb77ZT6wWoknfqobBMJ',
  amount: '2.000000',
  blockHash: '1e37662083f6be532537663d2dc0d8f3a99af5ed4c68fb5d642325254294a017',
  blockTime: 1596654200,
  category: 'receive',
  confirmations: 8865,
  time: 1596654200,
  trusted: true,
  hash: 'eb762a3e7802d72b0a5e78e4c2cbd6dd29d6ff3f9c1095d47ff9d02909cdc5ee',
  version: 1,
  size: 300,
  vSize: 300,
  vIn: [],
  vOut: [],
  hex: '01000000012c6f9f8c10cd5db62c01c591fd9e3736f42cec84ec59afea91fb7c0e503e20c8000000006a47304402203078ad70c8252be402f9f4d6e60e637528d648fb8dd0ebdfceaeb5ee03443eac02207536b8e8402b515ea495ad3b9e422aaa3f9c06fab34e0ec5a2a384aff5f3f87201210392b78bb64d3227c049ba3672a00f7ec300973b07581d88d972dbca0a727316bffeffffff021c3f1d0f6e0000001976a91419679b5b9d905671a2c0cd5798dde70d74cabc6388ac00f2052a010000001976a9149da5d5315113a53d7ff460e4011d455005b3acd988acebd60a00',
};
const otxBTC = {
  txId: 'e700c2d7b5f359a75e5c46eb336bbee70d1bd4760577b783628b49903426df14',
  address: '35x8RtuFsAnJCWEDQvJRDMi9Wa2k5Rs3Yp',
  amount: '1.12345678',
  blockHash: '2e37662083f6be532537663d2dc0d8f3a99af5ed4c68fb5d642325254294a017',
  blockTime: 1596660324,
  category: 'receive',
  confirmations: 8865,
  time: 1596660284,
  trusted: true,
  hash: 'e700c2d7b5f359a75e5c46eb336bbee70d1bd4760577b783628b49903426df14',
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
    walletController_getCurrencyMultipliers: () => resolvePromise('{"BCH":{"USD":222.18,"BTC":0.02215,"EUR":189.06,"GBP":193.8},"BLOCK":{"USD":0.8948,"BTC":0.0000892,"EUR":0.7609,"GBP":0.6904},"BTC":{"USD":10030.75,"BTC":1,"EUR":8530.25,"GBP":7739.5},"DASH":{"USD":72.48,"BTC":0.007228,"EUR":61.1,"GBP":55.94},"DGB":{"USD":0.02106,"BTC":0.0000021,"EUR":0.01792,"GBP":0.01625},"DOGE":{"USD":0.00266,"BTC":2.7e-7,"EUR":0.002313,"GBP":0.00209},"LTC":{"USD":47.41,"BTC":0.004725,"EUR":40.35,"GBP":41.25},"PHR":{"USD":0.0008025,"BTC":8e-8,"EUR":0.0006825,"GBP":0.0006192},"PIVX":{"USD":0.3868,"BTC":0.00003854,"EUR":0.326,"GBP":0.2985},"RVN":{"USD":0.01635,"BTC":0.00000163,"EUR":0.0139,"GBP":0.01262},"SYS":{"USD":0.06219,"BTC":0.0000062,"EUR":0.05288,"GBP":0.04798}}'),
    walletController_loadWallets: () => resolvePromise(true),
    walletController_updatePriceMultipliers: () => resolvePromise(true),
    walletController_updateBalanceInfo: (ticker) => resolvePromise(true),
    walletController_updateAllBalances: () => resolvePromise(true),
    walletController_walletRpcReady: () => resolvePromise(true),
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
    pricing_getPrice: async (ticker, currency) => {
      if (ticker === 'BLOCK') {
        return resolvePromise([
          new PriceData({date: "2020-09-07T00:00:00.000Z", close: 1.0, high: 1.9, low: 1.0, open: 1.67, volume: 10000.12, ticker: ticker, currency: currency}),
          new PriceData({date: "2020-09-08T00:00:00.000Z", close: 1.69, high: 1.91, low: 1.83, open: 1.0, volume: 15000.34, ticker: ticker, currency: currency}),
          new PriceData({date: "2020-09-09T00:00:00.000Z", close: 1.95, high: 1.9, low: 1.34, open: 1.41, volume: 47000.56, ticker: ticker, currency: currency}),
        ]);
      } else if (ticker === 'BTC') {
        return resolvePromise([
          new PriceData({date: "2020-08-01T00:00:00.000Z", close: 10375.0, high: 10410.9, low: 9880.0, open: 10258.67, volume: 11996.92866276, ticker: ticker, currency: currency}),
          new PriceData({date: "2020-08-02T00:00:00.000Z", close: 10125.69, high: 10440.91, low: 9819.83, open: 10375.0, volume: 15768.31017626, ticker: ticker, currency: currency}),
          new PriceData({date: "2020-08-03T00:00:00.000Z", close: 10239.95, high: 10286.9, low: 9983.34, open: 10126.41, volume: 4766.43687842, ticker: ticker, currency: currency}),
        ]);
      }
    },
    explorerLink: 'https://some-explorer.com',
    explorerTxLink: 'https://some-explorer.com',
    websiteLink: 'https://somewebsite.com',
    wallet_getExplorerLink: (ticker) => fakeApi.explorerLink,
    wallet_getExplorerLinkForTx: (ticker, tx) => fakeApi.explorerTxLink + '/' + tx,
    wallet_getWebsiteLink: (ticker) => fakeApi.websiteLink,
  });
  return fakeApi;
};

export default FakeApi;
