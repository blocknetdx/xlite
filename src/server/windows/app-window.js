import BrowserWindow from '../modules/browser-window';
import {MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH} from '../../app/constants';
import {storageKeys} from '../constants';

import _ from 'lodash';
import electron from 'electron';
import path from 'path';

const openAppWindow = (file, storage, devtools) => {
  let { height, width } = electron.screen.getPrimaryDisplay().workAreaSize;
  // Set last known screen size, otherwise use the default size
  let screenWidth;
  let screenHeight;
  const screenSize = storage.getItem(storageKeys.SCREEN_SIZE);
  if (_.has(screenSize, 'width') && _.has(screenSize, 'width')) {
    screenWidth = screenSize.width < width ? screenSize.width : width;
    screenHeight = screenSize.height < height ? screenSize.height : height;
  } else { // default height
    width *= 0.8;
    const nheight = width * 9/16;
    height = height >= nheight ? nheight : height;
    // Convert width and height to integers since some OS to display combinations ignore sizes with decimals
    screenWidth = width;
    screenHeight = height;
  }

  const windowOptions = {};
  windowOptions.minWidth = MIN_WINDOW_WIDTH;
  windowOptions.minHeight = MIN_WINDOW_HEIGHT;
  windowOptions.width = Math.floor(screenWidth);
  windowOptions.height = Math.floor(screenHeight);

  return new BrowserWindow({
    filePath: file,
    toggleDevTools: devtools,
    isMainWindow: true,
    windowOptions: windowOptions,
    webPreferences: {
      worldSafeExecuteJavaScript: true,
      allowRunningInsecureContent: false,
      contextIsolation: true,
      enableRemoteModule: false,
      nativeWindowOpen: false,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      safeDialogs: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      zoomFactor: 1.0,
      preload: path.join(__dirname, '../../app/api.js'),
    },
    onLoad() {
      this._window.webContents.setZoomFactor(storage.getItem(storageKeys.ZOOM_FACTOR));
    }
  });
};

export default openAppWindow;
