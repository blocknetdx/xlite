export default class FakeElectronMenu {

  built = false;
  poppedUp = false

  buildFromTemplate() {
    this.built = true;
    return {
      popup: () => {
        this.poppedUp = true;
      }
    };
  }

}
