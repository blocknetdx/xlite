import React from 'react';
import PropTypes from 'prop-types';
import Wallet from '../../types/wallet';
import Balance from '../shared/balance';
import { Column, Row } from '../shared/flex';
import AssetsOverviewPanel from '../shared/assets-overview-panel';
import TransactionsPanel from '../shared/transactions-panel';

const Dashboard = ({ activeWallet }) => {

  if(!activeWallet) return <div />;

  const balanceRowHeight = 314;
  const transactionsPanelWidth = 350;

  return (
    <div className={'lw-dashboard-container'}>
      <Row style={{height: balanceRowHeight, minHeight: balanceRowHeight, maxHeight: balanceRowHeight}}>
        <Column>
          <Balance />
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
