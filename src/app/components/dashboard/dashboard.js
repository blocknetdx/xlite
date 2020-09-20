import {all, create} from 'mathjs';
import AssetPieChart, {AssetPieChartData, chartColorForTicker} from '../shared/asset-piechart';
import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import domStorage from '../../modules/dom-storage';
import {Map as IMap} from 'immutable';
import Wallet from '../../types/wallet-r';
import Balance from '../shared/balance';
import BalanceFilters from '../shared/button-filters';
import { Column, Row } from '../shared/flex';
import AssetsOverviewPanel from '../shared/assets-overview-panel';
import Chart from '../shared/chart';
import {multiplierForCurrency, oneSat} from '../../util';
import TransactionsPanel from '../shared/transactions-panel';
import { SIDEBAR_WIDTH, balanceFilters, localStorageKeys } from '../../constants';
const math = create(all, {
  number: 'BigNumber',
  precision: 2
});
const { bignumber } = math;

const Dashboard = ({ windowHeight, windowWidth, altCurrency, wallets, balances, currencyMultipliers, balanceOverTime }) => {
  const [chartData, setChartData] = useState([[0, 0]]);
  const initialChartScale = domStorage.getItem(localStorageKeys.ACTIVE_CHART_FILTER) || 'half-year';
  const [chartScale, setChartScale] = useState(initialChartScale);

  const hideCharts = windowHeight < 650;
  const hidePriceGraph = windowWidth < 1280;
  const hideTransactions = windowWidth < 1180;

  useEffect(() => {
    if (multiplierForCurrency('BTC', altCurrency, currencyMultipliers) > 0)
      balanceOverTime(chartScale, altCurrency, currencyMultipliers)
        .then(data => {
          setChartData(data);
        });
  }, [setChartData, chartScale, balanceOverTime, altCurrency, currencyMultipliers]);

  const onBalanceFilterSelected = filter => {
    const selectedChartScale = Object.keys(balanceFilters).find(key => balanceFilters[key] === filter) || 'half-year';
    domStorage.setItem(localStorageKeys.ACTIVE_CHART_FILTER, selectedChartScale);
    setChartScale(selectedChartScale);
  };
  const containerHorizPadding = 20;
  const centerMargin = 30;
  const chartContainerHeight = hideCharts ? 108 : 360;
  const chartHeight = 250;
  const transactionsPanelWidth = 350;
  const chartWidth = windowWidth - SIDEBAR_WIDTH - transactionsPanelWidth - centerMargin - containerHorizPadding * 2;

  const pieChartData = [];
  for (const [ticker, balance] of balances) {
    const [total] = balance;
    const bnTotal = bignumber(total);
    const wallet = wallets.find(w => w.ticker === ticker);
    if (!wallet || isNaN(bnTotal.toNumber()) || bnTotal.toNumber() < oneSat) // at least 1 sat required to show on the pie chart
      continue; // skip unknown wallets or wallets with no balance
    const blockchain = wallet.blockchain();
    const currencyMultiplier = multiplierForCurrency(ticker, altCurrency, currencyMultipliers);
    const currencyAmount = math.multiply(bnTotal, bignumber(currencyMultiplier));
    const pieData = new AssetPieChartData(ticker, blockchain, altCurrency, currencyAmount.toNumber(), chartColorForTicker(ticker));
    pieChartData.push(pieData);
  }

  return (
    <div className={'lw-dashboard-container'} style={{paddingLeft: containerHorizPadding, paddingRight: containerHorizPadding}}>
      <Row style={{height: chartContainerHeight, minHeight: chartContainerHeight, maxHeight: chartContainerHeight}}>
        <Column>
          <div className={'lw-dashboard-info'}>
            <Balance />
            {!hideCharts ? <BalanceFilters selectedFilter={balanceFilters[chartScale]} filters={Object.values(balanceFilters).map(key => key)} onFilterSelected={onBalanceFilterSelected} /> : null}
          </div>
          {!hideCharts ?
            <Chart className={'lw-dashboard-chart'} chartData={chartData} currency={altCurrency} simple={false} simpleStrokeColor={'#ccc'}
              hideAxes={false} defaultWidth={chartWidth} defaultHeight={chartHeight}
              gradientTopColor={'#00ffff'} gradientBottomColor={'rgba(0, 71, 255, 0)'}
              chartGridColor={'#949494'} chartScale={chartScale} style={{flexGrow: 1}} />
            :
            null
          }
        </Column>
        {!hideCharts ?
          <Column className={'d-flex flex-column justify-content-center align-items-center'} style={{paddingTop: 15, marginLeft: centerMargin, width: transactionsPanelWidth, minWidth: transactionsPanelWidth, maxWidth: transactionsPanelWidth}}>
            <AssetPieChart className={'lw-portfolio-piechart'} defaultWidth={262} chartData={pieChartData} lineWidth={12} />
          </Column>
          :
          null
        }
      </Row>
      <Row style={{flexGrow: 1, minHeight: 0}}>
        <AssetsOverviewPanel showAllButton={true} brief={true} hidePercentBar={true} hideTicker={true} hideVolume={true} hidePriceGraph={hidePriceGraph} style={{ flexGrow: 1 }} />
        {!hideTransactions ?
          <TransactionsPanel
            showAllButton={true}
            brief={true}
            style={{ marginLeft: centerMargin, width: transactionsPanelWidth, minWidth: transactionsPanelWidth, maxWidth: transactionsPanelWidth }} />
            :
          null}
      </Row>
    </div>
  );
};
Dashboard.propTypes = {
  wallet: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  windowHeight: PropTypes.number,
  windowWidth: PropTypes.number,
  altCurrency: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(IMap),
  currencyMultipliers: PropTypes.object,
  balanceOverTime: PropTypes.func, // function('day|week|month|half-year|year', currency, currencyMultiplier)
};

export default Dashboard;
