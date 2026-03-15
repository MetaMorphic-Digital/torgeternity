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
      partContext.transferToClass = this.document.system.transferOnOutcome ? '' : 'hidden';
      partContext.applyOutcomeClass = this.document.system.transferOnOutcome ? 'hidden' : '';
      partContext.transferOutcomeClass = this.document.system.applyOnOutcome ? 'hidden' : '';
    }
    return partContext;
  }

  _onChangeForm(formConfig, event) {
    const outcome = event.target;
    if (outcome.name === 'system.applyOnOutcome') {
      const transferTo = this.element.querySelector('div.transferGroup');
      if (transferTo) {
        if (outcome.value)
          transferTo.classList.add('hidden')
        else
          transferTo.classList.remove('hidden')
      }
    } else if (outcome.name === 'system.transferOnOutcome') {
      const transferTo = this.element.querySelector('div.form-group:has(select[name="system.transferTo"])');
      const applyTo = this.element.querySelector('div.form-group:has(select[name="system.applyOnOutcome"])');
      if (transferTo) {
        if (outcome.value)
          transferTo.classList.remove('hidden')
        else
          transferTo.classList.add('hidden')
      }
      if (applyTo) {
        if (outcome.value)
          applyTo.classList.add('hidden')
        else
          applyTo.classList.remove('hidden')
      }
    }
    super._onChangeForm(formConfig, event);
  }
}