import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { activeViews } from '../constants';
import Login from './login';

let App = ({ appView, windowWidth, windowHeight }) => {

  const styles = {
    container: {
      position: 'relative',
      width: windowWidth,
      height: windowHeight
    }
  };

  let body;

  switch(appView) {
    case activeViews.LOGIN:
      body = <Login />;
      break;
    default:
      body = <div />;
  }

  return (
    <div style={styles.container}>
      {body}
    </div>
  );
};
App.propTypes = {
  windowWidth: PropTypes.number,
  windowHeight: PropTypes.number,
  appView: PropTypes.string
};
App = connect(
  ({ appState }) => ({
    windowWidth: appState.windowWidth,
    windowHeight: appState.windowHeight,
    appView: appState.appView
  })
)(App);

export default App;
