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
import { Map } from 'immutable';
import Wallet from '../../types/wallet';
import { all, create } from 'mathjs';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

const AssetsOverviewPanel = ({ hidePercentBar = false, hideTicker = false, hideVolume = false, altCurrency, balances, currencyMultipliers, style = {}, wallets, showAllButton = false, setActiveView }) => {

  const filteredWallets = wallets
    .filter(w => w.rpcEnabled)
    .sort(walletSorter(balances));

  const altBalances = {};
  let totalAltBalance = bignumber(0);

  for(const w of filteredWallets) {
    const { ticker } = w;
    const [ totalBalance ] = balances.get(ticker);
    const altMultiplier = bignumber(currencyMultipliers[ticker] && currencyMultipliers[ticker][altCurrency] ? currencyMultipliers[ticker][altCurrency] : 0);
    const balance = math.multiply(bignumber(Number(totalBalance)), altMultiplier);
    altBalances[ticker] = balance;
    totalAltBalance = math.add(totalAltBalance, balance);
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

              const [ totalBalance ] = balances.get(ticker);

              const percent = Number(math.multiply(math.divide(altBalances[ticker], totalAltBalance), bignumber(100)).toFixed(2));

              return (
                <TableRow key={ticker}>
                  <TableData>
                    <AssetWithImage shortenName={hideTicker} wallet={w} />
                  </TableData>
                  {!hideTicker ? <TableData>{ticker}</TableData> : null}
                  <TableData className={'text-monospace'}>{Number(altMultiplier.toFixed(MAX_DECIMAL_PLACE))}</TableData>
                  <TableData></TableData>
                  {!hideVolume ? <TableData></TableData> : null}
                  <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0}}>
                    {!hidePercentBar ?
                      <Column justify={'center'} style={{marginTop: -14}}>
                        <div style={{marginBottom: 3, textAlign: 'left'}}>{percent}</div>
                        <PercentBar percent={percent} />
                      </Column>
                      :
                      percent
                    }
                  </TableData>
                  <TableData className={'text-monospace'}>{Number(totalBalance)}</TableData>
                  <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <div>
                      {Number(math.multiply(bignumber(Number(totalBalance)), btcMultiplier).toFixed(MAX_DECIMAL_PLACE))}
                    </div>
                    <div className={'lw-color-secondary-3'}>
                      {`$${altBalances[ticker].toFixed(2)}`}
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
  hidePercentBar: PropTypes.bool,
  hideTicker: PropTypes.bool,
  hideVolume: PropTypes.bool,
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  balances: PropTypes.instanceOf(Map),
  currencyMultipliers: PropTypes.object,
  style: PropTypes.object,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  showAllButton: PropTypes.bool,
  setActiveView: PropTypes.func
};

export default connect(
  ({ appState }) => ({
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
