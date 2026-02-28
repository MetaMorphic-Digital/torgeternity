export default class TorgActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

  /** @override */
  static PARTS = {
    header: { template: "templates/sheets/active-effect/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    details: { template: "templates/sheets/active-effect/details.hbs", scrollable: [""] },
    torg: { template: "systems/torgeternity_dev/templates/active_effects/torg_effects.hbs", scrollable: [""] },
    duration: { template: "templates/sheets/active-effect/duration.hbs" },
    changes: { template: "templates/sheets/active-effect/changes.hbs", scrollable: ["ol[data-changes]"] },
    torgChanges: { template: "systems/torgeternity_dev/templates/active_effects/torg_changes.hbs", scrollable: ["ol[data-changes]"] },
    footer: { template: "templates/generic/form-footer.hbs" }
  };

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        { id: "details", icon: "fa-solid fa-book" },
        { id: "torg", icon: "fa-solid fa-swords" },
        { id: "duration", icon: "fa-solid fa-clock" },
        { id: "changes", icon: "fa-solid fa-gears" },
        { id: "torgChanges", icon: "fa-solid fa-warning" },
      ],
      initial: "details",
      labelPrefix: "EFFECT.TABS"
    },
  };

  /** @override **/
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["active-effect-config"],
    window: {
      contentClasses: ["standard-form"],
      icon: "fa-solid fa-person-rays"
    },
    position: {width: 800},
    form: {closeOnSubmit: false},
    actions: {
      addSkillChange: this.#onAddSkillChange,
      deleSkillChange: this.#onDeleteSkillChange
    }
  };

  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);
    if (partId === 'torg' || partId === 'torgChanges') {
      partContext.systemFields = this.document.system.schema.fields;
    }
    return partContext;
  }

 /* ----------------------------------------- */

  /**
   * Add a new skill change to the skill changes array
   * @this {ActiveEffectConfig}
   * @type {ApplicationClickAction}
   */
  static async #onAddSkillChange() {
    const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
    const changes = Object.values(submitData.system.skillsAdds ?? {});
    changes.push({key: "system.skills.airVehicles.adds", value:0}); // Push the default value
    return this.submit({updateData: {changes}});
  }

  /* ----------------------------------------- */

  /**
   * Delete a change from the skills changes array.
   * @this {ActiveEffectConfig}
   * @type {ApplicationClickAction}
   */
  static async #onDeleteSkillChange(event) {
    // TODO
  }
}