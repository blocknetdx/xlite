const fakeExecFile = () => {

  const stdoutCallbacks = {};
  const stderrCallbacks = {};
  let fakeChildProcess, callback, killed;

  return {
    execFile(filePath, args, cb) {
      callback = cb;
      fakeChildProcess = {
        // properties used by the CC CLI methods
        stdout: {
          on(eventName, func) {
            stdoutCallbacks[eventName] = func;
          }
        },
        stderr: {
          on(eventName, func) {
            stderrCallbacks[eventName] = func;
          }
        },
        stdin: {
          write() {

          }
        },
        kill() {
          killed = true;
        },
        exitCode: null
      };
      return fakeChildProcess;
    },
    // manipulation methods for testing only
    mockErr() {
      setTimeout(() => {
        callback(new Error('something'));
      }, 0);
    },
    mockWrite(str) {
      setTimeout(() => {
        stdoutCallbacks.data(Buffer.from(str, 'utf8'));
      }, 0);
    },
    mockClose() {
      setTimeout(() => {
        if(stdoutCallbacks.close) {
          stdoutCallbacks.close();
        } else {
          callback();
        }
      }, 0);
    },
    mockExitCode(code) {
      fakeChildProcess.exitCode = code;
    },
    wasKilled() {
      return killed;
    }
  };
};

export default fakeExecFile;
