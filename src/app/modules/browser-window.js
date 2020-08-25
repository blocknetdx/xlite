import { BrowserWindow as ElectronBrowserWindow, ipcMain } from 'electron';

const throwFilePathError = () => {
  throw new Error('You must pass in a filePath parameter when creating a new BrowserWindow. e.g. "/home/users/myUser/myProject/myWindow.html"');
};

class BrowserWindow {

  static _allWindows = [];
  static closeAllWindows = () => this._allWindows.forEach(w => w.close());

  data = new Map();
  _listeners = new Map();
  _window = null;
  send = null;

  constructor({ filePath = throwFilePathError(), toggleDevTools = false, isMainWindow = false, windowOptions = {}, webPreferences = {}, listeners = {}, onBeforeLoad, onLoad, onClose }) {

    const browserWindow = new ElectronBrowserWindow({
      useContentSize: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        ...webPreferences
      },
      ...windowOptions
    });
    BrowserWindow._allWindows.push(this);
    this._window = browserWindow;
    this.send = (key, message) => browserWindow.send(key, message);
    this.windowId = this._window.id;
    this.isMainWindow = isMainWindow;

    if(toggleDevTools) browserWindow.toggleDevTools();

    if (!isMainWindow) browserWindow.setMenu(null);

    if(onBeforeLoad) onBeforeLoad = onBeforeLoad.bind(this);
    if(onLoad) onLoad = onLoad.bind(this);
    if(onClose) onClose = onClose.bind(this);

    browserWindow.once('close', async function() {
      if(onClose) await onClose();

      // remove the window from our array of windows
      const winIdx = BrowserWindow._allWindows.findIndex(w => w.id = this.windowId);
      BrowserWindow._allWindows.splice(winIdx, 1);

      if (this.isMainWindow) BrowserWindow.closeAllWindows();
    }.bind(this));

    browserWindow.once('ready-to-show', async function() {
      if(onBeforeLoad) await onBeforeLoad();
      browserWindow.show();
      if(onLoad) await onLoad();
    }.bind(this));

    browserWindow.loadURL(`file://${filePath}`);

    browserWindow.on('closed', () => {
      for(const [event, listener] of [...this._listeners.entries()]) {
        ipcMain.removeListener(event, listener);
      }
      this._window = null;
    });

    for(const event of Object.keys(listeners)) {
      const userFunc = listeners[event].bind(this);
      const listener = async function(e, params) {
        if(e.sender === browserWindow.webContents) {
          await userFunc(e, params);
        }
      }.bind(this);
      ipcMain.on(event, listener);
      this._listeners.set(event, listener);
    }

  }

  async close() {
    try {
      if(this._window) this._window.close();
    } catch(err) {
      console.error(err);
    }
  }

  async show() {
    try {
      if(this._window) this._window.show();
    } catch(err) {
      console.error(err);
    }
  }
}

export default BrowserWindow;
