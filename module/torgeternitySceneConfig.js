import { torgeternity } from './config.js';

/**
 *
 */
export default class torgeternitySceneConfig extends foundry.applications.sheets.SceneConfig {

  static PARTS = {
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    basics: { template: "templates/scene/config/basics.hbs" },
    cosm: { template: `systems/torgeternity/templates/scenes/scenes-cosm.hbs` },
    grid: { template: "templates/scene/config/grid.hbs" },
    lighting: { template: "systems/torgeternity/templates/scenes/scenes-lighting.hbs", scrollable: [""] },
    ambience: { template: "templates/scene/config/ambience.hbs", scrollable: ["div.tab[data-tab=environment]"] },
    footer: { template: "templates/generic/form-footer.hbs" }
  };

  static TABS = {
    sheet: {
      tabs: [
        { id: "basics", icon: "fa-solid fa-image" },
        { id: "cosm", icon: "fa-solid fa-globe", label: "torgeternity.sheetLabels.cosm" },
        { id: "grid", icon: "fa-solid fa-grid" },
        { id: "lighting", icon: "fa-solid fa-lightbulb" },
        { id: "ambience", icon: "fa-solid fa-cloud-sun" }
      ],
      initial: "basics",
      labelPrefix: "SCENE.TABS.SHEET"
    },
    ambience: {
      tabs: [
        { id: "basic", icon: "fa-solid fa-table-list" },
        { id: "environment", icon: "fa-solid fa-cloud-sun" }
      ],
      initial: "basic",
      labelPrefix: "SCENE.TABS.AMBIENCE"
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
   * @param {*} formConfig 
   * @param {*} event 
   * @returns 
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
