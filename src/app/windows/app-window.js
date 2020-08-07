import electron from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import BrowserWindow from '../modules/browser-window';
import { storageKeys } from '../constants';

const openAppWindow = storage => {
  let { height, width } = electron.screen.getPrimaryDisplay().workAreaSize;
  width *= 0.6;
  const nheight = width * 9/16;
  height = height >= nheight ? nheight : height;
  return new BrowserWindow({
    filePath: path.resolve(__dirname, '../../index.html'),
    toggleDevTools: isDev ? true : false,
    isMainWindow: true,
    windowOptions: {
      width: width,
      height: height
    },
    webPreferences: {
      zoomFactor: 1.0
    },
    onLoad() {
      this._window.webContents.setZoomFactor(storage.getItem(storageKeys.ZOOM_FACTOR));
    }
  });
};

export default openAppWindow;
