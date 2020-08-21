import electron from 'electron';
import path from 'path';
import BrowserWindow from '../modules/browser-window';
import { storageKeys } from '../constants';

const openAppWindow = (storage, devtools) => {
  let { height, width } = electron.screen.getPrimaryDisplay().workAreaSize;
  width *= 0.8;
  const nheight = width * 9/16;
  height = height >= nheight ? nheight : height;
  return new BrowserWindow({
    filePath: path.resolve(__dirname, '../../index.html'),
    toggleDevTools: devtools,
    isMainWindow: true,
    windowOptions: {
      // Convert width and height to integers since some OS to display combinations ignore sizes with decimals
      width: Math.floor(width),
      height: Math.floor(height)
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
