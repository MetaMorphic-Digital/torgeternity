/**
 * A class that represents the MacroHub
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class MacroHub extends HandlebarsApplicationMixin(ApplicationV2) {


  static DEFAULT_OPTIONS = {
    classes: ['torgeternity', 'centered', 'macroHub', 'themed', 'theme-dark'],
    window: {
      title: 'torgeternity.macros.macroHub.title',
      resizable: false,
      contentClasses: ['standard-form'],
    },
    position: {
      //center: true,
    },
    actions: {
      executeMacro: MacroHub.#executeMacro
    }
  }

  static PARTS = {
    hub: { template: 'systems/torgeternity/templates/macrohub/hub.html' }
  }

  /**
   * @inheritDoc 
   */
  async _prepareContext(options) {
    const data = await super._prepareContext(options);

    const macros = await game.packs.get('torgeternity.macros').index.filter(p => !p.name.startsWith('+'));
    const sortable = [];

    for (const macro of macros) {
      sortable.push(macro);
    }

    sortable.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name === b.name) {
        return 0;
      } else {
        return 1;
      }
    });

    data.macros = {};
    Object.assign(data.macros, sortable);
    return data;
  }

  toggleRender() {
    if (!this.rendered)
      return this.render({ force: true });
    else if (this._minimized)
      return this.maximize();
    else
      return this.close();
  }

  /** 
   * @this {MacroHub}
  */
  static async #executeMacro(event) {
    const macroPack = game.packs.get('torgeternity.macros');
    const macroId = event.target.closest('.macroHubSpan').dataset.macroId;
    return macroPack.getDocument(macroId).then((m) => m.execute());
  }
}
