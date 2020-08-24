import {all, create} from 'mathjs';
import AssetPieChart, {AssetPieChartData, chartColorForTicker} from '../shared/asset-piechart';
import React from 'react';
import PropTypes from 'prop-types';
import Wallet from '../../types/wallet';
import Balance from '../shared/balance';
import { Column, Row } from '../shared/flex';
import AssetsOverviewPanel from '../shared/assets-overview-panel';
import Chart, {chartSampleData} from '../shared/chart';
import TransactionsPanel from '../shared/transactions-panel';
import { SIDEBAR_WIDTH } from '../../constants';
const math = create(all, {
  number: 'BigNumber',
  precision: 2
});
const { bignumber } = math;

const Dashboard = ({ activeWallet, windowWidth, altCurrency, wallets, balances, currencyMultipliers }) => {

  if(!activeWallet) return <div />;

  const containerHorizPadding = 25;
  const centerMargin = 30;
  const chartContainerHeight = 360;
  const chartHeight = 250;
  const transactionsPanelWidth = 350;
  const chartWidth = windowWidth - SIDEBAR_WIDTH - transactionsPanelWidth - centerMargin - containerHorizPadding * 2;

  const pieChartData = [];
  for (const [ticker, balance] of balances) {
    const [total] = balance;
    const wallet = wallets.find(w => w.ticker === ticker);
    if (!wallet || total < 1/100000000) // at least 1 sat required to show on the pie chart
      continue; // skip unknown wallets or wallets with no balance
    const blockchain = wallet.blockchain();
    const currencyMultiplier = currencyMultipliers && currencyMultipliers[ticker] && currencyMultipliers[ticker][altCurrency]
                                 ? currencyMultipliers[ticker][altCurrency] : 0;
    const currencyAmount = math.multiply(bignumber(total), bignumber(currencyMultiplier));
    const pieData = new AssetPieChartData(ticker, blockchain, altCurrency, currencyAmount.toNumber(), chartColorForTicker(ticker));
    pieChartData.push(pieData);
  }

  return (
    <div className={'lw-dashboard-container'} style={{paddingLeft: containerHorizPadding, paddingRight: containerHorizPadding}}>
      <Row style={{height: chartContainerHeight, minHeight: chartContainerHeight, maxHeight: chartContainerHeight}}>
        <Column>
          <Balance />
          <Chart className={'lw-dashboard-chart'} chartData={chartSampleData} simple={false} simpleStrokeColor={'#ccc'}
                 hideAxes={false} defaultWidth={chartWidth} defaultHeight={chartHeight}
                 gradientTopColor={'#00ffff'} gradientBottomColor={'rgba(0, 71, 255, 0)'}
                 chartGridColor={'#949494'} chartScale={'half-year'} style={{ flexGrow: 1 }} />
        </Column>
        <Column className={'d-flex flex-column justify-content-center align-items-center'} style={{paddingTop: 15, marginLeft: centerMargin, width: transactionsPanelWidth, minWidth: transactionsPanelWidth, maxWidth: transactionsPanelWidth}}>
          <AssetPieChart className={'lw-portfolio-piechart'} defaultWidth={262} chartData={pieChartData} lineWidth={12} />
        </Column>
      </Row>
      <Row style={{flexGrow: 1, minHeight: 0}}>
        <AssetsOverviewPanel showAllButton={true} hidePercentBar={true} hideTicker={true} hideVolume={true} style={{ flexGrow: 1 }} />
        <TransactionsPanel
          showAllButton={true}
          brief={true}
          style={{ marginLeft: centerMargin, width: transactionsPanelWidth, minWidth: transactionsPanelWidth, maxWidth: transactionsPanelWidth }} />
      </Row>
    </div>
  );
};
Dashboard.propTypes = {
  wallet: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  activeWallet: PropTypes.string,
  windowWidth: PropTypes.number,
  altCurrency: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(Map),
  currencyMultipliers: PropTypes.object,
};

export default Dashboard;
