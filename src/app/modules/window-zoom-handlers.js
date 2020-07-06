import { ipcRenderer, webFrame } from 'electron';
import * as uuid from 'uuid';
import { ipcMainListeners, ipcRendererListeners, ZOOM_MAX, ZOOM_MIN } from '../constants';

// We need to do our comparison operations using whole numbers, so we multiply by 100
const maxZoom = ZOOM_MAX * 100;
const minZoom = ZOOM_MIN * 100;

const { platform } = process;

const getZoomFactor = () => {
  return parseInt((webFrame.getZoomFactor() * 100).toFixed(0), 10);
};

window.document.addEventListener('keydown', e => {
  const { key, ctrlKey, metaKey } = e;
  const ctrlCmd = platform === 'darwin' ? metaKey : ctrlKey;
  if(!ctrlCmd) return;
  const zoomFactor = getZoomFactor();
  if(zoomFactor < maxZoom && key === '=') { // zoom in
    e.preventDefault();
    ipcRenderer.send(ipcMainListeners.ZOOM_IN);
  } else if(zoomFactor > minZoom && key === '-') { // zoom out
    e.preventDefault();
    ipcRenderer.send(ipcMainListeners.ZOOM_OUT);
  } else if(key === '0') { // reset zoom
    e.preventDefault();
    ipcRenderer.send(ipcMainListeners.ZOOM_RESET);
  }
});

let scrolling = false;
window.addEventListener('mousewheel', e => {
  if(!scrolling) {
    const { deltaY, ctrlKey, metaKey } = e;
    const ctrlCmd = platform === 'darwin' ? metaKey : ctrlKey;
    if(!ctrlCmd) return;
    e.preventDefault();
    const zoomFactor = getZoomFactor();
    scrolling = true;
    if(zoomFactor < maxZoom && deltaY < 0 ) { // zoom in
      ipcRenderer.send(ipcMainListeners.ZOOM_IN);
    } else if(zoomFactor > minZoom && deltaY > 0) { // zoom out
      ipcRenderer.send(ipcMainListeners.ZOOM_OUT);
    }
    setTimeout(() => {
      scrolling = false;
    }, 50);
  }
});

const showZoomLevel = percent => {
  const id = uuid.v4();
  const styles = 'opacity:.9;background-color:#fff;color:#000;width:70px;height:30px;line-height:30px;font-size:14px;text-align:center;position:fixed;right:0;top:0;z-index:10000;';
  const className = 'js-zoomLevelContainer';
  $(`.${className}`).remove();
  $('body').append(`<div id="${id}" class="${className}" style="${styles}">${percent.toFixed(0)}%</div>`);
  setTimeout(() => {
    $(`#${id}`).remove();
  }, 2000);
};

const applyZoomFactor = (e , zoomFactor) => {
  webFrame.setZoomFactor(zoomFactor);
  showZoomLevel(zoomFactor * 100);
};

ipcRenderer.on(ipcRendererListeners.ZOOM_IN, applyZoomFactor);
ipcRenderer.on(ipcRendererListeners.ZOOM_OUT, applyZoomFactor);
ipcRenderer.on(ipcRendererListeners.ZOOM_RESET, e => {
  applyZoomFactor(e, 1);
});
