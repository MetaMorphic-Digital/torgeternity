/**
 *
 */
export default class TorgeternitySceneNav extends foundry.applications.ui.SceneNavigation {

  static PARTS = {
    scenes: {
      root: true,
      template: "systems/torgeternity/templates/scenes/scene-nav.hbs"
    },
  }

  /**
   * @inheritDoc 
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.lang = game.settings.get('core', 'language');

    function updateScene(data) {
      const scene = game.scenes.get(data.id)
      const torg = game.scenes.get(scene.id).torg;

      const zoneType = {
        mixed: `torgeternity.cosms.mixed`,
        pure: `torgeternity.cosms.pure`,
        dominant: `torgeternity.cosms.dominant`,
      }
      // Add extra torg data into each scene
      const cosm1name = (torg.cosm !== 'other') ? game.i18n.localize(CONFIG.torgeternity.cosmTypes[torg.cosm]) : torg.otherName1;
      const cosm2name = torg.cosm2 && ((torg.cosm2 !== 'other') ? game.i18n.localize(CONFIG.torgeternity.cosmTypes[torg.cosm2]) : torg.otherName2);

      let cosms = `${game.i18n.localize(zoneType[torg.zone])}: ${cosm1name}`
      if (torg.cosm2) cosms += ` + ${cosm2name}`;

      let tooltip = data.tooltip ? `<p>${data.tooltip}</p>` : '';
      tooltip += `<table class="cosm-axioms">
      <p>${cosms}</p>
        <thead>
          <td class="axiom-label">${game.i18n.localize('torgeternity.sheetLabels.magic')}</td>
          <td class="axiom-label">${game.i18n.localize('torgeternity.sheetLabels.social')}</td>
          <td class="axiom-label">${game.i18n.localize('torgeternity.sheetLabels.spirit')}</td>
          <td class="axiom-label">${game.i18n.localize('torgeternity.sheetLabels.tech')}</td>
        </thead>
        <tbody>
          <td class="axiom-value">${scene.flags.torgeternity.axioms.magic}</td>
          <td class="axiom-value">${scene.flags.torgeternity.axioms.social}</td>
          <td class="axiom-value">${scene.flags.torgeternity.axioms.spirit}</td>
          <td class="axiom-value">${scene.flags.torgeternity.axioms.tech}</td>
        </tbody>
      </table>`;

      return {
        ...data,
        tooltip,
        torg
      }
    }

    // scenes.viewed = Foundry 14
    if (context.scenes.viewed) context.scenes.viewed = updateScene(context.scenes.viewed);
    context.scenes.active = context.scenes.active.map(scene => updateScene(scene));
    context.scenes.inactive = context.scenes.inactive.map(scene => updateScene(scene));
    context.y1pp = game.settings.get('torgeternity', 'y1pp');
    context.fixedOpaque = 'fixedOpaque';
    return context;
  }
}
