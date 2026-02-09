export default class TorgActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

  /** @override */
  static PARTS = {
    header: { template: "templates/sheets/active-effect/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    details: { template: "templates/sheets/active-effect/details.hbs", scrollable: [""] },
    torg: { template: "systems/torgeternity/templates/active-effect-torg.hbs", scrollable: [""] },
    duration: { template: "templates/sheets/active-effect/duration.hbs" },
    changes: { template: "templates/sheets/active-effect/changes.hbs", scrollable: ["ol[data-changes]"] },
    footer: { template: "templates/generic/form-footer.hbs" }
  };

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        { id: "details", icon: "fa-solid fa-book" },
        { id: "torg", icon: "fa-solid fa-swords" },
        { id: "duration", icon: "fa-solid fa-clock" },
        { id: "changes", icon: "fa-solid fa-gears" }
      ],
      initial: "details",
      labelPrefix: "EFFECT.TABS"
    },
  };

  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);
    if (partId === 'torg') {
      partContext.systemFields = this.document.system.schema.fields;
    }
    return partContext;
  }
}