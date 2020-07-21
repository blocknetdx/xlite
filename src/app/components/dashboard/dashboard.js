import React from 'react';
import PropTypes from 'prop-types';
import Wallet from '../../types/wallet';
import Balance from '../shared/balance';

const Dashboard = ({ activeWallet }) => {

  if(!activeWallet) return <div />;

  return (
    <div className={'lw-dashboard-container'}>
      <Balance />
    </div>
  );
};
Dashboard.propTypes = {
  wallet: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  activeWallet: PropTypes.string
};

export default Dashboard;
