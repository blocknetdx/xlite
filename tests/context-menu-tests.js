/*global describe,it,beforeEach*/

import ContextMenu from '../src/server/modules/context-menu';
import FakeElectronMenu from './fake-electron-menu';

describe('ContextMenu Test Suite', function() {
  let contextMenu;
  beforeEach(function() {
    contextMenu = new ContextMenu(new FakeElectronMenu());
  });
  it('contextMenu.showCopyMenu', function() {
    contextMenu.showCopyMenu();
    contextMenu._Menu.built.should.be.True();
    contextMenu._Menu.poppedUp.should.be.True();
  });
  it('contextMenu.showPasteMenu', function() {
    contextMenu.showPasteMenu();
    contextMenu._Menu.built.should.be.True();
    contextMenu._Menu.poppedUp.should.be.True();
  });
  it('contextMenu.showStandardMenu', function() {
    contextMenu.showStandardMenu();
    contextMenu._Menu.built.should.be.True();
    contextMenu._Menu.poppedUp.should.be.True();
  });
});
