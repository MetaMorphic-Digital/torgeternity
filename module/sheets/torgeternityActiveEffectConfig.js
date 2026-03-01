export default class TorgActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

  /** @override */
  static PARTS = {
    header: {
      template: "templates/sheets/active-effect/header.hbs"
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs"
    },
    details: {
      template: "templates/sheets/active-effect/details.hbs",
      scrollable: [""]
    },
    torg: {
      template: "systems/torgeternity_dev/templates/active_effects/torg_effects.hbs",
      scrollable: [""]
    },
    duration: {
      template: "templates/sheets/active-effect/duration.hbs"
    },
    changes: {
      template: "templates/sheets/active-effect/changes.hbs",
      scrollable: ["ol[data-changes]"]
    },
    torgChanges: {
      template: "systems/torgeternity_dev/templates/active_effects/torg_changes.hbs",
      scrollable: ["ol[data-changes]"]
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  };

  /** @override */
  static TABS = {
    sheet: {
      tabs: [{
          id: "details",
          icon: "fa-solid fa-book"
        },
        {
          id: "torg",
          icon: "fa-solid fa-swords"
        },
        {
          id: "duration",
          icon: "fa-solid fa-clock"
        },
        {
          id: "changes",
          icon: "fa-solid fa-gears"
        },
        {
          id: "torgChanges",
          icon: "fa-solid fa-gears"
        },
      ],
      initial: "torgChanges",
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
    position: {
      width: 560
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: true,
    },
    actions: {
      addSkillAddsChange: this.#onAddSkillAddsChange,
      deleteSkillAddsChange: this.#onDeleteSkillAddsChange,
      addAttributesChange: this.#onAddAttributeChange,
      deleteAttributesChange: this.#onDeleteAttributesChange
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
  static async #onAddSkillAddsChange() {
    const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
    const wholeChange = Object.values(submitData.system)
    const skillAddsChanges = Object.values(submitData.system.skillsAdds || {});
    skillAddsChanges.push({
      key: "system.skills.airVehicles.adds",
      value: 0,
      _id: foundry.utils.randomID()
    }); // Push a default value otherwise recounciliation will skip it.
    return this.submit({
      updateData: {
        system: {
          ...wholeChange,
          skillsAdds: skillAddsChanges
        }
      }
    })
  }

  /* ----------------------------------------- */
  /**
   * Delete a change from the skills changes array.
   * @this {ActiveEffectConfig}
   * @type {ApplicationClickAction}
   */
  static async #onDeleteSkillAddsChange(event) {
    const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
    const wholeChange = Object.values(submitData.system)
    const changes = Object.values(submitData.system.skillsAdds);
    const row = event.target.closest("li");
    const index = Number(row.dataset.skillAddsIndex) || 0;
    changes.splice(index, 1);
    return this.submit({
      updateData: {
        system: {
          ...wholeChange,
          skillsAdds: changes
        }
      }
    });
  }

  /* ----------------------------------------- */
  /**
   * Add a new skill change to the skill changes array
   * @this {ActiveEffectConfig}
   * @type {ApplicationClickAction}
   */
  static async #onAddAttributeChange() {
    const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
    const wholeChange = Object.values(submitData.system)
    const attributesAddsChanges = Object.values(submitData.system.attributesAdds || {});
    attributesAddsChanges.push({
      key: "system.attributes.charisma.value",
      value: 0,
      _id: foundry.utils.randomID()
    }); // Push a default value otherwise recounciliation will skip it.
    return this.submit({
      updateData: {
        system: {
          ...wholeChange,
          attributesAdds: attributesAddsChanges
        }
      }
    })
  }

  /* ----------------------------------------- */
  /**
   * Delete a change from the skills changes array.
   * @this {ActiveEffectConfig}
   * @type {ApplicationClickAction}
   */
  static async #onDeleteAttributesChange(event) {
    const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
    const wholeChange = Object.values(submitData.system)
    const changes = Object.values(submitData.system.attributesAdds);
    const row = event.target.closest("li");
    const index = Number(row.dataset.attributesAddsIndex) || 0;
    changes.splice(index, 1);
    return this.submit({
      updateData: {
        system: {
          ...wholeChange,
          attributesAdds: changes
        }
      }
    });
  }
}
