import * as uuid from 'uuid';
import { DEFAULT_ZOOM_FACTOR, platforms, ZOOM_MAX, ZOOM_MIN } from '../constants';

const { api } = window;

// We need to do our comparison operations using whole numbers, so we multiply by 100
const maxZoom = ZOOM_MAX * 100;
const minZoom = ZOOM_MIN * 100;

const platform = api.general_getPlatform();

const getZoomFactor = () => {
  return parseInt((api.general_getZoomFactor() * 100).toFixed(0), 10);
};

window.document.addEventListener('keydown', e => {
  const { key, ctrlKey, metaKey } = e;
  const ctrlCmd = platform === platforms.mac ? metaKey : ctrlKey;
  if(!ctrlCmd) return;
  const zoomFactor = getZoomFactor();
  if(zoomFactor < maxZoom && key === '=') { // zoom in
    e.preventDefault();
    api.general_zoomIn();
  } else if(zoomFactor > minZoom && key === '-') { // zoom out
    e.preventDefault();
    api.general_zoomOut();
  } else if(key === '0') { // reset zoom
    e.preventDefault();
    api.general_zoomReset();
  }
});

let scrolling = false;
window.addEventListener('mousewheel', e => {
  if(!scrolling) {
    const { deltaY, ctrlKey, metaKey } = e;
    const ctrlCmd = platform === platforms.mac ? metaKey : ctrlKey;
    if(!ctrlCmd) return;
    e.preventDefault();
    const zoomFactor = getZoomFactor();
    scrolling = true;
    if(zoomFactor < maxZoom && deltaY < 0 ) { // zoom in
      api.general_zoomIn();
    } else if(zoomFactor > minZoom && deltaY > 0) { // zoom out
      api.general_zoomOut();
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

const applyZoomFactor = zoomFactor => {
  api.general_setZoomFactor(zoomFactor);
  showZoomLevel(zoomFactor * 100);
};

api.general_onZoomIn(applyZoomFactor);
api.general_onZoomOut(applyZoomFactor);
api.general_onZoomReset(() => {
  applyZoomFactor(DEFAULT_ZOOM_FACTOR);
});
