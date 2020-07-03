import { actions, localStorageKeys } from '../constants';
import { Map } from 'immutable';
import domStorage from '../modules/dom-storage';

const convertManifestToMap = manifest => manifest.reduce((map, obj) => map.set(obj.ticker, obj), Map());

const getInitialState = () => ({
  windowHeight: window.innerHeight,
  windowWidth: window.innerWidth,
  manifest: convertManifestToMap(domStorage.getItem(localStorageKeys.MANIFEST) || [])
});

export default (state = getInitialState(), { type, payload }) => {
  switch(type) {
    case actions.SET_WINDOW_SIZE:
      return {
        ...state,
        windowWidth: payload.width,
        windowHeight: payload.height
      };
    case actions.SET_MANIFEST:
      return {
        ...state,
        manifest: convertManifestToMap(payload.manifest)
      };
    default:
      return state;
  }
};
