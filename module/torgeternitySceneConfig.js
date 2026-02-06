import { torgeternity } from './config.js';

/**
 *
 */
export default class torgeternitySceneConfig extends foundry.applications.sheets.SceneConfig {

  // Foundry 14 changes some tab names, so we have to be clever to support V13 and V14
  static PARTS = {
    cosm: { template: `systems/torgeternity/templates/scenes/scenes-cosm.hbs` },
    ...foundry.applications.sheets.SceneConfig.PARTS,
  };

  static TABS = foundry.utils.mergeObject(foundry.applications.sheets.SceneConfig.TABS, {
    sheet: {
      tabs: foundry.applications.sheets.SceneConfig.TABS.sheet.tabs.toSpliced(1, 0,
        { id: "cosm", icon: "fa-solid fa-globe", label: "torgeternity.sheetLabels.cosm" },
      )
    },
  })

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    const pos = options.parts.indexOf('cosm');
    if (pos >= 0) {
      // Move 'cosm' tab between first and last tab
      options.parts.splice(0, 1);
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
        partContext.zones = torgeternity.zones;
        partContext.cosmTypes = torgeternity.cosmTypes;
        break;
      case "lighting":
        context.torgDarkness = game.settings.get('torgeternity', 'autoDarknessPenalty');
        break;
    }
    return partContext;
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