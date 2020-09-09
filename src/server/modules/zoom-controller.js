import { BrowserWindow as ElectronBrowserWindow } from 'electron';
import bindAll from 'lodash/bindAll';
import {
  DEFAULT_ZOOM_FACTOR,
  ZOOM_INCREMENT,
  ZOOM_MAX,
  ZOOM_MIN
} from '../../app/constants';
import {storageKeys} from '../constants';
import { apiConstants } from '../../app/api';

// This should only be used in the main process
class ZoomController {

  constructor(storage) {
    this._storage = storage;
    bindAll(this, [
      'zoomIn',
      'zoomOut',
      'zoomReset'
    ]);
  }

  zoomIn() {
    const storage = this._storage;
    const zoomFactor = storage.getItem(storageKeys.ZOOM_FACTOR);
    if(zoomFactor < ZOOM_MAX) {
      const windows = ElectronBrowserWindow.getAllWindows();
      const newZoomFactor = zoomFactor + ZOOM_INCREMENT;
      windows.forEach(w => {
        w.send(apiConstants.general_onZoomIn, newZoomFactor);
      });
      storage.setItem(storageKeys.ZOOM_FACTOR, newZoomFactor);
    }
  }

  zoomOut() {
    const storage = this._storage;
    const zoomFactor = storage.getItem(storageKeys.ZOOM_FACTOR);
    if(zoomFactor > ZOOM_MIN) {
      const windows = ElectronBrowserWindow.getAllWindows();
      const newZoomFactor = zoomFactor - ZOOM_INCREMENT;
      windows.forEach(w => {
        w.send(apiConstants.general_onZoomOut, newZoomFactor);
      });
      storage.setItem(storageKeys.ZOOM_FACTOR, newZoomFactor);
    }
  }

  zoomReset() {
    const storage = this._storage;
    const windows = ElectronBrowserWindow.getAllWindows();
    windows.forEach(w => {
      w.send(apiConstants.general_onZoomReset);
    });
    storage.setItem(storageKeys.ZOOM_FACTOR, DEFAULT_ZOOM_FACTOR);
  }

}

export default ZoomController;
