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
        }
        callback();
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

export class FakeSpawn {
  stdoutCallbacks = {};
  stderrCallbacks = {};
  killed = false;

  spawn = () => {
    const stdoutOn = (function(eventName, func) {
      if (!this.stdoutCallbacks[eventName])
        this.stdoutCallbacks[eventName] = [];
      if (func)
        this.stdoutCallbacks[eventName].push(func);
    }).bind(this);
    const stderrOn = (function(eventName, func) {
      if (!this.stderrCallbacks[eventName])
        this.stderrCallbacks[eventName] = [];
      if (func)
        this.stderrCallbacks[eventName].push(func);
    }).bind(this);
    return {
      // properties used by the CC CLI methods
      stdout: {
        on: stdoutOn
      },
      stderr: {
        on: stderrOn
      },
      stdin: {
        write() {}
      },
      kill: () => {
        this.killed = true;
      },
      exitCode: null
    };
  }

  stdout(name, data = '', wait = 0) {
    setTimeout(() => {
      const cbs = this.stdoutCallbacks[name];
      if (cbs) {
        for (const cb of cbs)
          cb(data);
      }
    }, wait);
  }

  stderr(name, data = '', wait = 0) {
    setTimeout(() => {
      const cbs = this.stderrCallbacks[name];
      if (cbs) {
        for (const cb of cbs)
          cb(data);
      }
    }, wait);
  }

  clear() {
    this.stdoutCallbacks = {};
    this.stderrCallbacks = {};
    this.killed = false;
  }
}

export default fakeExecFile;
