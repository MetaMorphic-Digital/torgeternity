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
      let tooltip = data.tooltip ? `<p>${data.tooltip}</p>` : '';
      tooltip += `<table class="cosm-axioms">
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
