import { connect } from 'react-redux';
import Portfolio from './portfolio';

export default connect(
  ({ appState }) => ({
    windowWidth: appState.windowWidth,
    altCurrency: appState.altCurrency,
    currencyMultipliers: appState.currencyMultipliers,
  })
)(Portfolio);
