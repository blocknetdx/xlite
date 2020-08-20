import React from 'react';
import PropTypes from 'prop-types';
import Wallet from '../../types/wallet';
import Balance from '../shared/balance';
import { Column, Row } from '../shared/flex';
import AssetsOverviewPanel from '../shared/assets-overview-panel';
import Chart, {chartSampleData} from '../shared/chart';
import TransactionsPanel from '../shared/transactions-panel';

const Dashboard = ({ activeWallet }) => {

  if(!activeWallet) return <div />;

  const chartContainerHeight = 360;
  const chartHeight = 250;
  const transactionsPanelWidth = 350;

  return (
    <div className={'lw-dashboard-container'}>
      <Row style={{height: chartContainerHeight, minHeight: chartHeight, maxHeight: chartContainerHeight}}>
        <Column>
          <Balance />
          <Chart className={'lw-dashboard-chart'} chartData={chartSampleData} simple={false} simpleStrokeColor={'#ccc'}
                 hideAxes={false} defaultWidth={700} defaultHeight={chartHeight}
                 gradientTopColor={'#00ffff'} gradientBottomColor={'rgba(0, 71, 255, 0)'}
                 chartGridColor={'#949494'} chartScale={'half-year'} style={{ flexGrow: 1 }} />
        </Column>
        <Column>
        </Column>
      </Row>
      <Row style={{flexGrow: 1, minHeight: 0}}>
        <AssetsOverviewPanel showAllButton={true} hidePercentBar={true} hideTicker={true} hideVolume={true} style={{ flexGrow: 1 }} />
        <TransactionsPanel
          showAllButton={true}
          hideAddress={true}
          hideAmount={true}
          style={{ marginLeft: 30, width: transactionsPanelWidth, minWidth: transactionsPanelWidth, maxWidth: transactionsPanelWidth }} />
      </Row>
    </div>
  );
};
Dashboard.propTypes = {
  wallet: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  activeWallet: PropTypes.string
};

export default Dashboard;
