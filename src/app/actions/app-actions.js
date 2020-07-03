import { actions } from '../constants';

/**
 * @param width {number}
 * @param height {number}
 * @returns {{payload: {width: number, height: number}, type: string}}
 */
export const setWindowSize = (width, height) => ({
  type: actions.SET_WINDOW_SIZE,
  payload: {
    width,
    height,
  },
});

/**
 * @param manifest {Map}
 * @returns {{payload: {manifest: Map}, type: string}}
 */
export const setManifest = manifest => ({
  type: actions.SET_MANIFEST,
  payload: {
    manifest
  }
});
