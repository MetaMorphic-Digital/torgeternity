/**
 *
 */
export class PossibilityByCosm extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['torgeternity', 'themed', 'theme-dark'],
    tag: 'form',
    position: {
      width: 'auto',
      height: 'auto',
    },
    window: {
      title: 'torgeternity.sheetLabels.possibilityByCosm',
      resizeable: false,
      contentClasses: ['standard-form'],
    },
    actions: {
      testActiveModule: PossibilityByCosm.#onTestActiveModule,
    },
    form: {
      handler: PossibilityByCosm.#onSave,
      closeOnSubmit: true
    }
  }

  static PARTS = {
    body: { template: 'systems/torgeternity/templates/possibilityByCosm.hbs', },
    footer: { template: "templates/generic/form-footer.hbs", },
  }

  /**
   *
   * @param actor
   */
  constructor(options = {}) {
    super(options);
    //this.actor = actor;
  }

  /**
   *
   * @param actor
   */
  static async create(actor) {
    new PossibilityByCosm({ document: actor }).render({ force: true });
  }

  /**
   *
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actorPoss = this.actor.getFlag('torgeternity', 'possibilityByCosm') ?? {};
    actorPoss.coreEarthPoss = this.actor.system.other.possibilities;

    const cosms = {};
    for (const cosm in CONFIG.torgeternity.cosmTypes) {
      if (cosm === 'none') continue;
      cosms[cosm] = {
        name: game.i18n.localize(`torgeternity.cosms.${cosm}`),
        uuid: game.i18n.localize(`torgeternity.cosms.${cosm}PossLink`),
        hash: game.i18n.localize(`torgeternity.cosms.${cosm}PossLink2`),
        icon: CONFIG.torgeternity.cosmPossyIcons[cosm],
        largeIcon: CONFIG.torgeternity.cosmPossyLargeIcons[cosm],
        actorField: `${cosm}Poss`
      }
    }

    return Object.assign(context, {
      cosms,
      actor: this.actor,
      actorPoss,
      buttons: [
        { type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" }
      ],
    })
  }

  /**
   *
   * @param event
   */
  static async #onTestActiveModule(event) {
    const tes = await fromUuid(event.target.dataset.uuid, { strict: false });
    if (!tes) ui.notifications.warn(game.i18n.localize('torgeternity.notifications.moduleNotActive'));
  }

  /**
   *
   * @param event
   */
  static async #onSave(event, form, formData) {
    const actor = this.actor;
    await actor.setFlag('torgeternity', 'possibilityByCosm', formData.object);
    await actor.update({ "system.other.possibilities": formData.object.coreEarthPoss });
  }

  static toggleRender(user) {
    for (const app of foundry.applications.instances.values()) {
      if (app instanceof PossibilityByCosm) {
        if (app.rendered) {
          if (app._minimized) return this.maximize();
          return app.close()
        }
      }
    }
    // Not found, so open a new one
    PossibilityByCosm.create(user);
  }
}
