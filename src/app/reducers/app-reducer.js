import { actions, activeViews } from '../constants';
import { Map } from 'immutable';

const getInitialState = () => ({
  activeView: activeViews.LOGIN,
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
    case actions.SET_ACTIVE_VIEW:
      return {
        ...state,
        activeView: payload.activeView
      };
    default:
      return state;
  }
};
