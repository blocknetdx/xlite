import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import { Card, CardBody, CardFooter, CardHeader } from './card';
import Localize from './localize';
import { Table, TableColumn, TableData, TableRow } from './table';
import AssetWithImage from './asset-with-image';
import * as appActions from '../../actions/app-actions';
import { activeViews, MAX_DECIMAL_PLACE, altCurrencySymbol, altCurrencies } from '../../constants';
import { Column } from './flex';
import PercentBar from './percent-bar';
import { multiplierForCurrency, walletSorter } from '../../util';
import {Map as IMap} from 'immutable';
import Wallet from '../../types/wallet-r';
import { all, create } from 'mathjs';
import Chart from './chart';
import moment from 'moment';
import Pricing from '../../modules/pricing-r';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

/**
 * Convert price data into expected chart data.
 * @param priceData {PriceData}
 */
const chartDataFromPriceData = priceData => {
  if (!priceData)
    return [];
  return [moment(priceData.date).unix(), priceData.close || priceData.open];
};

const AssetsOverviewPanel = ({ hidePercentBar = false, hideTicker = false, hideVolume = false, hidePercent = false, hidePriceGraph = false, hideCoinText = false, altCurrency, balances, currencyMultipliers, style = {}, wallets, showAllButton = false, pricingController, setActiveView, pricingData, setActiveWallet }) => {
  const filteredWallets = wallets
    .filter(w => w.rpcEnabled())
    .sort(walletSorter(balances));

  const altBalances = {};
  let totalAltBalance = bignumber(0);

  for(const w of filteredWallets) {
    const { ticker } = w;
    const [ totalBalance ] = balances.has(ticker) ? balances.get(ticker) : ['0'];
    const altMultiplier = bignumber(multiplierForCurrency(ticker, altCurrency, currencyMultipliers));
    const balance = math.multiply(bignumber(Number(totalBalance)), altMultiplier);
    altBalances[ticker] = balance;
    totalAltBalance = math.add(totalAltBalance, balance);
  }

  const pricingChartData = new Map();
  if (pricingData) {
    for (const [key, value = []] of pricingData.entries()) {
      const sortedData = value
        .filter(pd => pd.isHistoricalData())
        .map(pd => chartDataFromPriceData(pd))
        .sort((a,b) => b[0] - a[0]); // sort by unix time descending (recent time first)
      if (sortedData.length > 0) // Only add it if there is data
        pricingChartData.set(key, sortedData.slice(0, 7)); // 1 week of data
    }
  }

  const styles = {
    inactiveFooterButton: {
      color: '#c8cdd6'
    }
  };

  const volumeInAltCurrency = ticker => {
    const volume = bignumber(pricingController.getVolume(ticker, altCurrency));
    const altMultiplier = bignumber(multiplierForCurrency(ticker, altCurrency, currencyMultipliers));
    return math
      .multiply(altMultiplier, volume)
      .toNumber();
  };

  return (
    <Card style={style}>
      <CardHeader>
        <h1><Localize context={'portfolio'}>Assets Overview</Localize></h1>
      </CardHeader>
      <CardBody>
        <Table>
          <TableColumn size={1}><Localize context={'portfolio'}>Asset</Localize></TableColumn>
          {!hideTicker ? <TableColumn size={1}><Localize context={'portfolio'}>Ticker</Localize></TableColumn> : null}
          <TableColumn size={1}><Localize context={'portfolio'}>Price</Localize> ({altCurrency})</TableColumn>
          {!hidePriceGraph ? <TableColumn className={'lw-card-tablecolumn-hideable'} size={1}><Localize context={'portfolio'}>Price graph (7d)</Localize></TableColumn> : null}
          {!hideVolume ? <TableColumn size={1}><Localize context={'portfolio'}>Volume (24hr)</Localize></TableColumn> : null}
          {!hidePercent ? <TableColumn size={1}><Localize context={'portfolio'}>Portfolio %</Localize></TableColumn> : null}
          <TableColumn size={1}><Localize context={'portfolio'}>Amount</Localize></TableColumn>
          <TableColumn size={1}>{Localize.text('Value ({{value}})', 'portfolio', {value: altCurrencies.BTC})}</TableColumn>
          {filteredWallets
            .map(w => {

              const { ticker } = w;

              const altMultiplier = bignumber(multiplierForCurrency(ticker, altCurrency, currencyMultipliers));
              const btcMultiplier = bignumber(multiplierForCurrency(ticker, altCurrencies.BTC, currencyMultipliers));

              const [ totalBalance ] = balances.has(ticker) ? balances.get(ticker) : ['0'];

              const percent = totalAltBalance > 0 ? Number(math.multiply(math.divide(altBalances[ticker], totalAltBalance), bignumber(100)).toFixed(2))
                                                  : (0).toFixed(2);
              const priceChartData = pricingChartData.get(ticker) || null;

              const onRowClick = () => {
                setActiveWallet(ticker);
                setActiveView(activeViews.COIN_TRANSACTIONS);
              };

              return (
                <TableRow key={ticker} clickable={true} onClick={onRowClick}>
                  <TableData>
                    <AssetWithImage shortenName={hideTicker || hideCoinText} wallet={w} />
                  </TableData>
                  {!hideTicker ? <TableData>{ticker}</TableData> : null}
                  <TableData className={'text-monospace'}>{altCurrencySymbol(altCurrency)}{Number(altMultiplier.toFixed(MAX_DECIMAL_PLACE))}</TableData>
                  {!hidePriceGraph ?
                    <TableData>
                    {/*  Only render chart if data is available */}
                    {priceChartData ? <Chart chartData={priceChartData} simple={true} simpleStrokeColor={'#ccc'}
                           hideAxes={true} defaultWidth={108} defaultHeight={26}
                           chartGridColor={'#949494'} chartScale={'week'} /> : null}
                    </TableData>
                    : null
                  }
                  {!hideVolume ?
                    <TableData>{altCurrencySymbol(altCurrency) + Localize.number(volumeInAltCurrency(ticker), 0)}</TableData>
                    :
                    null
                  }
                  {!hidePercent ?
                    <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0}}>
                      {!hidePercentBar ?
                        <Column justify={'center'} style={{marginTop: -8}}>
                          <div style={{marginBottom: 3, textAlign: 'left'}}>{percent}</div>
                          <PercentBar percent={Number(percent)} />
                        </Column>
                        :
                        percent
                      }
                    </TableData>
                    :
                    null
                  }
                  <TableData className={'text-monospace'}>{Number(totalBalance)}</TableData>
                  <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right'}}>
                    <div>
                      {Number(math.multiply(bignumber(Number(totalBalance)), btcMultiplier).toFixed(MAX_DECIMAL_PLACE))}
                    </div>
                    <div className={'lw-card-tablerow-bottom-label'}>
                      {`${altCurrencySymbol(altCurrency)}${altBalances[ticker].toFixed(2)}`}
                    </div>
                  </TableData>
                </TableRow>
              );
            })
          }
        </Table>
      </CardBody>
      <CardFooter>
        {showAllButton ?
          <a href={'#'} onClick={e => {
            e.preventDefault();
            setActiveView(activeViews.PORTFOLIO);
          }}><Localize context={'portfolio'}>View all assets</Localize> <i className={'fas fa-chevron-right'} /></a>
          :
          <a style={styles.inactiveFooterButton}><Localize context={'universal'}>Nothing more to load</Localize></a>
        }
      </CardFooter>
    </Card>
  );
};
AssetsOverviewPanel.propTypes = {
  pricingData: PropTypes.instanceOf(IMap),
  hidePercentBar: PropTypes.bool,
  hideTicker: PropTypes.bool,
  hideVolume: PropTypes.bool,
  hidePercent: PropTypes.bool,
  hidePriceGraph: PropTypes.bool,
  hideCoinText: PropTypes.bool,
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  balances: PropTypes.instanceOf(IMap),
  currencyMultipliers: PropTypes.object,
  style: PropTypes.object,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  showAllButton: PropTypes.bool,
  pricingController: PropTypes.instanceOf(Pricing),
  setActiveView: PropTypes.func,
  setActiveWallet: PropTypes.func,
};

export default connect(
  ({ appState }) => ({
    pricingData: appState.pricing,
    activeWallet: appState.activeWallet,
    altCurrency: appState.altCurrency,
    balances: appState.balances,
    currencyMultipliers: appState.currencyMultipliers,
    pricingController: appState.pricingController,
    wallets: appState.wallets
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(appActions.setActiveView(activeView)),
    setActiveWallet: ticker => dispatch(appActions.setActiveWallet(ticker)),
  })
)(AssetsOverviewPanel);
