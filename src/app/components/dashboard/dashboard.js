import React from 'react';
import PropTypes from 'prop-types';
import Wallet from '../../types/wallet';
import Balance from '../shared/balance';
import { Column, Row } from '../shared/flex';
import AssetPieChart, {chartSampleData as pieSampleData} from '../shared/asset-piechart';
import AssetsOverviewPanel from '../shared/assets-overview-panel';
import Chart, {chartSampleData} from '../shared/chart';
import TransactionsPanel from '../shared/transactions-panel';
import { SIDEBAR_WIDTH } from '../../constants';

const Dashboard = ({ activeWallet, windowWidth }) => {

  if(!activeWallet) return <div />;

  const containerHorizPadding = 25;
  const centerMargin = 30;
  const chartContainerHeight = 360;
  const chartHeight = 250;
  const transactionsPanelWidth = 350;
  const chartWidth = windowWidth - SIDEBAR_WIDTH - transactionsPanelWidth - centerMargin - containerHorizPadding * 2;

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
          <AssetPieChart className={'lw-portfolio-piechart'} defaultWidth={262} chartData={pieSampleData} lineWidth={12} />
        </Column>
      </Row>
      <Row style={{flexGrow: 1, minHeight: 0}}>
        <AssetsOverviewPanel showAllButton={true} hidePercentBar={true} hideTicker={true} hideVolume={true} style={{ flexGrow: 1 }} />
        <TransactionsPanel
          showAllButton={true}
          hideAddress={true}
          hideAmount={true}
          style={{ marginLeft: centerMargin, width: transactionsPanelWidth, minWidth: transactionsPanelWidth, maxWidth: transactionsPanelWidth }} />
      </Row>
    </div>
  );
};
Dashboard.propTypes = {
  wallet: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  activeWallet: PropTypes.string,
  windowWidth: PropTypes.number
};

export default Dashboard;
