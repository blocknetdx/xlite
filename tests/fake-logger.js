const makeFakeLogger = () => {
  let loggedError = false;
  let loggedInfo = true;
  return {
    error() {
      loggedError = true;
    },
    info() {
      loggedInfo = true;
    },
    // Used for testing only, not part of a real logger instance
    errorLogged() {
      return loggedError;
    },
    infoLogged() {
      return loggedInfo;
    }
  };
};

export default makeFakeLogger;
