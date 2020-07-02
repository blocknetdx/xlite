import { actions } from '../constants';

const getInitialState = () => ({
  windowHeight: window.innerHeight,
  windowWidth: window.innerWidth
});

export default (state = getInitialState(), { type, payload }) => {
  switch(type) {
    case actions.SET_WINDOW_SIZE:
      return {
        ...state,
        windowWidth: payload.width,
        windowHeight: payload.height
      };
    default:
      return state;
  }
};
