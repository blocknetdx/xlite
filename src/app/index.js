import { app, ipcMain,  Menu } from 'electron';
import contextMenu from 'electron-context-menu';
import path from 'path';
import openAppWindow from './windows/app-window';
import SimpleStorage from './modules/storage';
import { DATA_DIR, DEFAULT_LOCALE, DEFAULT_ZOOM_FACTOR, ipcMainListeners, storageKeys } from './constants';
import windowMenu from './modules/window-menu';
import Localize from './components/shared/localize';
import { getLocaleData, handleError } from './util';
import ZoomController from './modules/zoom-controller';

// Handle any uncaught exceptions
process.on('uncaughtException', err => {
  handleError(err);
});
process.on('unhandledRejection', err => {
  handleError(err);
});

let appWindow;

// Only allow one instance of the application open at a time
const unlocked = app.requestSingleInstanceLock();
if(!unlocked) {
  app.quit();
}
app.on('second-instance', () => {
  if(appWindow) {
    if (appWindow._window.isMinimized()) appWindow._window.restore();
    appWindow._window.focus();
  }
});

// A key/value store for persisting app-wide settings data
const storage = new SimpleStorage(path.join(DATA_DIR, 'app-settings.json'));

// Initialize the localization module
let locale = storage.getItem(storageKeys.LOCALE);
if(!locale) locale = storage.setItem(storageKeys.LOCALE, DEFAULT_LOCALE);
Localize.initialize({
  locale,
  localeData: getLocaleData(locale)
});

// Handle zoom changes
if(!storage.getItem(storageKeys.ZOOM_FACTOR)) storage.setItem(storageKeys.ZOOM_FACTOR, DEFAULT_ZOOM_FACTOR);
ipcMain.on(ipcMainListeners.SET_ZOOM_FACTOR, (e, zoomFactor) => storage.setItem(storageKeys.ZOOM_FACTOR, zoomFactor));
ipcMain.on(ipcMainListeners.GET_ZOOM_FACTOR, (e) => e.returnValue = storage.getItem(storageKeys.ZOOM_FACTOR));
const zoomController = new ZoomController(storage);
ipcMain.on(ipcMainListeners.ZOOM_IN, zoomController.zoomIn);
ipcMain.on(ipcMainListeners.ZOOM_OUT, zoomController.zoomOut);
ipcMain.on(ipcMainListeners.ZOOM_RESET, zoomController.zoomReset);

// Add a default context menu
contextMenu();

// Set the default app-wide window menu
const appMenu = Menu.buildFromTemplate(windowMenu(Localize, zoomController));
Menu.setApplicationMenu(appMenu);

// Start the application
app.on('ready', async function() {
  appWindow = openAppWindow(storage);
});
