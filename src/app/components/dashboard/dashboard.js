import React from 'react';
import PropTypes from 'prop-types';
import Wallet from '../../types/wallet';

const Dashboard = ({ activeWallet }) => {

  if(!activeWallet) return <div />;

  return (
    <div className={'lw-dashboard-container'}>
      <h1>{activeWallet} Dashboard</h1>
    </div>
  );
};
Dashboard.propTypes = {
  wallet: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  activeWallet: PropTypes.string
};

export default Dashboard;
