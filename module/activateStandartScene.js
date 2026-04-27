/**
 * Activates the standard scene on first startup
 */
export async function activateStandartScene() {
  const pack = game.packs.get('torgeternity.core-scenes');
  const sceneId = pack.index.getName('Main scene')._id;
  game.scenes.importFromCompendium(pack, sceneId).then((s) => {
    s.update({
      name: _loc('torgeternity.scenes.main') || 'Main Scene',
      active: true,
    });
  });
}
