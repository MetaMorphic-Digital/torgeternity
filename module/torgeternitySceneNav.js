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
      // Add extra torg data into each scene
      const scene = game.scenes.get(data.id)
      const cosm1name = (scene.flags.torgeternity.cosm !== 'other') ?
        game.i18n.localize(CONFIG.torgeternity.cosmTypes[scene.flags.torgeternity.cosm]) : scene.flags.torgeternity.otherName1;
      const cosm2name = scene.flags.torgeternity.cosm !== 'none' && ((scene.flags.torgeternity.cosm2 !== 'other') ?
        game.i18n.localize(CONFIG.torgeternity.cosmTypes[scene.flags.torgeternity.cosm2]) : scene.flags.torgeternity.otherName2);

      const cosms = cosm2name
        ? game.i18n.format('torgeternity.sheetLabels.scenes.twoCosmTip', { cosm1: cosm1name, cosm2: cosm2name })
        : game.i18n.format('torgeternity.sheetLabels.scenes.oneCosmTip', { cosm1: cosm1name });

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
        torg: game.scenes.get(scene.id).torg
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
