import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { activeViews } from '../constants';
import Login from './login';
import Dashboard from './dashboard';
import { Navbar } from './shared/navbar';

let App = ({ activeView, windowWidth, windowHeight }) => {

  const styles = {
    container: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      width: windowWidth,
      height: windowHeight,
      minHeight: 0
    },
    bodyContainer: {
      flexGrow: 1
    }
  };

  let body;

  let showNavbar = true;

  switch(activeView) {
    case activeViews.LOGIN:
      body = <Login />;
      showNavbar = false;
      break;
    case activeViews.DASHBOARD:
      body = <Dashboard />;
      break;
    default:
      body = <div />;
  }

  return (
    <div style={styles.container}>
      {showNavbar ? <Navbar /> : null}
      <div style={styles.bodyContainer}>
        {body}
      </div>
    </div>
  );
};
App.propTypes = {
  windowWidth: PropTypes.number,
  windowHeight: PropTypes.number,
  activeView: PropTypes.string
};
App = connect(
  ({ appState }) => ({
    windowWidth: appState.windowWidth,
    windowHeight: appState.windowHeight,
    activeView: appState.activeView
  })
)(App);

export default App;
