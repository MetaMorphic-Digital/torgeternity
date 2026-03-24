import TorgeternityScene from './documents/torgeternityscene.js'

export default class torgeternitySceneConfig extends foundry.applications.sheets.SceneConfig {

  // Add our COSM tab
  static PARTS = {
    ...super.PARTS,
    cosm: { template: `systems/torgeternity/templates/scenes/scenes-cosm.hbs` },
  };

  static TABS = foundry.utils.mergeObject(foundry.applications.sheets.SceneConfig.TABS, {
    sheet: {
      tabs: foundry.applications.sheets.SceneConfig.TABS.sheet.tabs.toSpliced(1, 0,
        { id: "cosm", icon: "fa-solid fa-globe", label: "torgeternity.sheetLabels.cosm" },
      )
    },
  }, { inplace: false })

  /**
   * Fix the ordering of the TABS, to have COSM as the second visible tab.
   * @param {*} options 
   */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    const pos = options.parts.indexOf('cosm');
    if (pos >= 0) {
      // Move 'cosm' tab between first and last tab
      options.parts.splice(pos, 1);
      options.parts.splice(2, 0, 'cosm');
    }
  }

  static torgFields;

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const fields = foundry.data.fields;

    if (!this.torgFields)
      this.torgFields = new fields.SchemaField({
        dimLightThreshold: new fields.AlphaField({
          initial: 0.05, min: 0.05, max: 0.9,
          label: game.i18n.localize("SCENE.FIELDS.flags.torgeternity.dimLightThreshold.name"),
          hint: game.i18n.localize("SCENE.FIELDS.flags.torgeternity.dimLightThreshold.hint"),
        }),
        darkThreshold: new fields.AlphaField({
          initial: 0.9, min: 0.1, max: 0.95,
          label: game.i18n.localize("SCENE.FIELDS.flags.torgeternity.darkThreshold.name"),
          hint: game.i18n.localize("SCENE.FIELDS.flags.torgeternity.darkThreshold.hint"),
        }),
      })

    context.flagFields = this.torgFields;
    return context;
  }

  async _preparePartContext(partId, context, options) {
    const partContext = await super._preparePartContext(partId, context, options);
    switch (partId) {
      case "cosm":
        partContext.zones = CONFIG.torgeternity.zones;
        partContext.cosmTypes = CONFIG.torgeternity.cosmTypes;
        partContext.axioms = { magic: 10, social: 10, spirit: 10, tech: 10 };
        break;
      case "lighting":
        context.torgDarkness = game.settings.get('torgeternity', 'autoDarknessPenalty');
        break;
    }
    return partContext;
  }

  /**
 * Insert our own sliders into the Lighting/Visibility tab
 * @param {*} context 
 * @param {*} _options 
 * @returns 
 */
  async _renderHTML(context, _options) {
    const rendered = await super._renderHTML(context, _options);
    if (!game.settings.get('torgeternity', 'autoDarknessPenalty')) return rendered;

    const tab = rendered.lighting || rendered.visibility;
    if (!tab) return rendered;

    const globalLightEnabled = tab.querySelector('div.form-group:has(input[name="environment.globalLight.enabled"])');
    if (!globalLightEnabled) {
      console.log('failed to find Scene Config tab for darkness levels');
      return rendered;
    }
    globalLightEnabled.after(...Object.values(this.torgFields.fields).map(value => value.toFormGroup({},
      {
        name: `flags.torgeternity.${value.name}`,
        value: context.source.flags.torgeternity[value.name],
        step: 0.05,
        classes: 'slim'
      })));

    // Change label and hint of darkness
    const maxDarkness = tab.querySelector('div.form-group:has(range-picker[name="environment.globalLight.darkness.max"]');
    if (maxDarkness) {
      maxDarkness.querySelector('label').innerText = game.i18n.localize('SCENE.FIELDS.flags.torgeternity.pitchBlackThreshold.label');
      maxDarkness.querySelector('p.hint').innerText = game.i18n.localize('SCENE.FIELDS.flags.torgeternity.pitchBlackThreshold.hint');
    }
    return rendered;
  }

  /**
   * Ensure all sliders remain within valid ranges based on the slider being moved
   * @inheritDoc 
  */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    if (event.type !== 'change') return;
    switch (event.target.name) {
      case 'flags.torgeternity.zone': {
        const elem = this.element.querySelector('div.cosm-secondary');
        if (elem) elem.style.display = (event.target.value === 'pure') ? 'none' : '';
        // continue through to next case
      }
      case 'flags.torgeternity.cosm':
      case 'flags.torgeternity.cosm2':
        // Recalculate axioms
        {
          const formData = new foundry.applications.ux.FormDataExtended(this.form);
          const axioms = TorgeternityScene.getAxioms(formData.object["flags.torgeternity.cosm"],
            formData.object["flags.torgeternity.cosm2"],
            formData.object["flags.torgeternity.zone"]);
          // Copy to input fields
          this.element.querySelector('input[name="flags.torgeternity.axioms.magic"').value = axioms.magic;
          this.element.querySelector('input[name="flags.torgeternity.axioms.social"').value = axioms.social;
          this.element.querySelector('input[name="flags.torgeternity.axioms.spirit"').value = axioms.spirit;
          this.element.querySelector('input[name="flags.torgeternity.axioms.tech"').value = axioms.tech;
          // Maybe change visibility of the manual cosm name fields:
          if (event.target.name === 'flags.torgeternity.cosm')
            this.element.querySelector('div.cosm-other-name1').style.display = (event.target.value === 'other') ? '' : 'none';
          else
            this.element.querySelector('div.cosm-other-name2').style.display = (event.target.value === 'other') ? '' : 'none';
          break;
        }

      case 'flags.torgeternity.dimLightThreshold':
      case 'flags.torgeternity.darkThreshold':
      case 'environment.globalLight.darkness.max': {
        const step = Number(event.target.getAttribute('step'));
        // Get the input's new value
        const newValue = Number(event.target._value);
        // Get the range pickers
        const html = this.element;
        const dimLightRangePicker = html.querySelector(`range-picker[name="flags.torgeternity.dimLightThreshold"]`);
        const darkRangePicker = html.querySelector(`range-picker[name="flags.torgeternity.darkThreshold"]`);
        const pitchDarknessRangePicker = html.querySelector(`range-picker[name="environment.globalLight.darkness.max"]`);
        // Get the current values from each threshold setting
        const dimLightValue = Number(dimLightRangePicker.querySelector('input').value);
        const darkValue = Number(darkRangePicker.querySelector('input').value);
        const pitchDarknessValue = Number(pitchDarknessRangePicker.querySelector('input').value);
        const newHigherValue = Math.round((newValue + step) * 20) / 20;
        const newLowerValue = Math.round((newValue - step) * 20) / 20;

        if (event.target.name.includes('dimLightThreshold')) {
          if (darkValue <= newValue) darkRangePicker.value = newHigherValue;
        } else if (event.target.name.includes('darkThreshold')) {
          if (pitchDarknessValue <= newValue) pitchDarknessRangePicker.value = newHigherValue;
          if (dimLightValue >= newValue) dimLightRangePicker.value = newLowerValue;
        } else if (event.target.name.includes('environment.globalLight')) {
          if (darkValue >= newValue) darkRangePicker.value = newLowerValue;
        }
        break;
      }
    }
  }
}



Hooks.on('getSceneControlButtons', controls => {
  controls.lighting.tools.dim = {
    name: "dim",
    order: 2.3,
    title: "CONTROLS.LightDim",
    icon: "fa-solid fa-cloud-sun",
    visible: !canvas.scene?.environment.darknessLock,
    onChange: () => canvas.scene.update(
      { environment: { darknessLevel: canvas.scene.flags.torgeternity.dimLightThreshold } },
      { animateDarkness: CONFIG.torgeternity.toDimLightAnimationMS }
    ),
    button: true,
  };
  controls.lighting.tools.dark = {
    name: "dark",
    order: 2.7,
    title: "CONTROLS.LightDark",
    icon: "fa-solid fa-cloud-moon",
    visible: !canvas.scene?.environment.darknessLock,
    onChange: () => canvas.scene.update(
      { environment: { darknessLevel: canvas.scene.flags.torgeternity.darkThreshold } },
      { animateDarkness: CONFIG.torgeternity.toDarkAnimationMS }
    ),
    button: true,
  };
})