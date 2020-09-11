import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import { Card, CardBody, CardFooter, CardHeader } from './card';
import Localize from './localize';
import { Table, TableColumn, TableData, TableRow } from './table';
import AssetWithImage from './asset-with-image';
import * as appActions from '../../actions/app-actions';
import { activeViews, MAX_DECIMAL_PLACE } from '../../constants';
import { Column } from './flex';
import PercentBar from './percent-bar';
import { walletSorter } from '../../util';
import {Map as IMap} from 'immutable';
import Wallet from '../../types/wallet-r';
import { all, create } from 'mathjs';
import Chart from './chart';
import moment from 'moment';

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

const AssetsOverviewPanel = ({ hidePercentBar = false, hideTicker = false, hideVolume = false, altCurrency, balances, currencyMultipliers, style = {}, wallets, showAllButton = false, setActiveView, pricingData }) => {
  const filteredWallets = wallets
    .filter(w => w.rpcEnabled())
    .sort(walletSorter(balances));

  const altBalances = {};
  let totalAltBalance = bignumber(0);

  for(const w of filteredWallets) {
    const { ticker } = w;
    const [ totalBalance ] = balances.has(ticker) ? balances.get(ticker) : ['0'];
    const altMultiplier = bignumber(currencyMultipliers[ticker] && currencyMultipliers[ticker][altCurrency] ? currencyMultipliers[ticker][altCurrency] : 0);
    const balance = math.multiply(bignumber(Number(totalBalance)), altMultiplier);
    altBalances[ticker] = balance;
    totalAltBalance = math.add(totalAltBalance, balance);
  }

  const pricingChartData = new Map();
  if (pricingData) {
    for (const [key, value] of pricingData.entries()) {
      if (!value || value.length === 0)
        continue; // skip if no data
      const sortedData = value.map(pd => chartDataFromPriceData(pd))
                           .sort((a,b) => b[0] - a[0]); // sort by unix time descending (recent time first)
      pricingChartData.set(key, sortedData.slice(0, 7)); // 1 week of data
    }
  }

  const styles = {
    inactiveFooterButton: {
      color: '#c8cdd6'
    }
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
          <TableColumn size={1}><Localize context={'portfolio'}>Price graph (7d)</Localize></TableColumn>
          {!hideVolume ? <TableColumn size={1}><Localize context={'portfolio'}>Volume (24hr)</Localize></TableColumn> : null}
          <TableColumn size={1}><Localize context={'portfolio'}>Portfolio %</Localize></TableColumn>
          <TableColumn size={1}><Localize context={'portfolio'}>Amount</Localize></TableColumn>
          <TableColumn size={1}><Localize context={'portfolio'}>Value</Localize> (BTC)</TableColumn>
          {filteredWallets
            .map(w => {

              const { ticker } = w;

              const altMultiplier = bignumber(currencyMultipliers[ticker] && currencyMultipliers[ticker][altCurrency] ? currencyMultipliers[ticker][altCurrency] : 0);
              const btcMultiplier = bignumber(currencyMultipliers[ticker] && currencyMultipliers[ticker]['BTC'] ? currencyMultipliers[ticker]['BTC'] : 0);

              const [ totalBalance ] = balances.has(ticker) ? balances.get(ticker) : ['0'];

              const percent = totalAltBalance > 0 ? Number(math.multiply(math.divide(altBalances[ticker], totalAltBalance), bignumber(100)).toFixed(2))
                                                  : (0).toFixed(2);
              const priceChartData = pricingChartData.get(ticker) || null;

              return (
                <TableRow key={ticker}>
                  <TableData>
                    <AssetWithImage shortenName={hideTicker} wallet={w} />
                  </TableData>
                  {!hideTicker ? <TableData>{ticker}</TableData> : null}
                  <TableData className={'text-monospace'}>{Number(altMultiplier.toFixed(MAX_DECIMAL_PLACE))}</TableData>
                  <TableData>
                  {/*  Only render chart if data is available */}
                  {priceChartData ? <Chart chartData={priceChartData} simple={true} simpleStrokeColor={'#ccc'}
                         hideAxes={true} defaultWidth={108} defaultHeight={26}
                         chartGridColor={'#949494'} chartScale={'week'} /> : null}
                  </TableData>
                  {!hideVolume ? <TableData></TableData> : null}
                  <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0}}>
                    {!hidePercentBar ?
                      <Column justify={'center'} style={{marginTop: -14}}>
                        <div style={{marginBottom: 3, textAlign: 'left'}}>{percent}</div>
                        <PercentBar percent={Number(percent)} />
                      </Column>
                      :
                      percent
                    }
                  </TableData>
                  <TableData className={'text-monospace'}>{Number(totalBalance)}</TableData>
                  <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right'}}>
                    <div>
                      {Number(math.multiply(bignumber(Number(totalBalance)), btcMultiplier).toFixed(MAX_DECIMAL_PLACE))}
                    </div>
                    <div className={'lw-card-tablerow-bottom-label'}>
                      {`${altCurrency} ${altBalances[ticker].toFixed(2)}`}
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
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  balances: PropTypes.instanceOf(IMap),
  currencyMultipliers: PropTypes.object,
  style: PropTypes.object,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  showAllButton: PropTypes.bool,
  setActiveView: PropTypes.func
};

export default connect(
  ({ appState }) => ({
    pricingData: appState.pricing,
    activeWallet: appState.activeWallet,
    altCurrency: appState.altCurrency,
    balances: appState.balances,
    currencyMultipliers: appState.currencyMultipliers,
    wallets: appState.wallets
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(appActions.setActiveView(activeView))
  })
)(AssetsOverviewPanel);
