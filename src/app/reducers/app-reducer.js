import { actions } from '../constants';
import { Map } from 'immutable';

const getInitialState = () => ({
  windowHeight: window.innerHeight,
  windowWidth: window.innerWidth,
  manifest: Map()
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
        manifest: payload.manifest
      };
    default:
      return state;
  }
};
