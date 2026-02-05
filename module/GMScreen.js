/**
 *
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class GMScreen extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    //tag: 'form',
    id: "GMscreen",
    classes: ['torgeternity', 'themed', 'theme-dark'],
    position: {
      top: 10,
      width: 1300,
      height: 500,
    },
    window: {
      resizable: true,
      //contentClasses: ['standard-form'],
      title: 'torgeternity.gmScreen.title',
    },
    actions: {
      clickPanel: GMScreen.#clickPanel,
    }
  };

  static PARTS = {
    gmscreen: { template: 'systems/torgeternity/templates/gmscreen/screen.html' },
  };

  /**
   *
   * @param evt
   * @this {GMScreen}
   */
  static #clickPanel(evt) {
    let cl;

    const GMScreen = this.element.querySelectorAll('#gm-screen')[0];
    switch (evt.target.id) {
      case 'right-panel':
        cl = 'focus-right';

        break;
      case 'center-panel':
        cl = 'focus-center';

        break;
      case 'left-panel':
        cl = 'focus-left';

        break;
    }
    GMScreen.classList.toggle(cl);
  }

  /**
   * @inheritDoc 
   */
  async _prepareContext(options) {
    const data = await super._prepareContext(options);
    const path = game.settings.get('torgeternity', 'gmScreen');
    let lang = game.settings.get('core', 'language');

    // setting english as default
    if (lang !== 'en' && lang !== 'de' && lang !== 'fr') {
      lang = 'en';
    }
    if (path === 'none') {
      data.noScreen = true;
      data.background = false;
    } else {
      data.background = `style="background-image:url(./modules/${path}/images/gmscreen/${lang}.webp)"`;
    }
    return data;
  }
  /**
   *
   */
  toggleRender() {
    if (!this.rendered)
      return this.render({ force: true });
    else if (this._minimized)
      return this.maximize();
    else
      return this.close();
  }
}
