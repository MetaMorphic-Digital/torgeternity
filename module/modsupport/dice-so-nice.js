/**
 *
 * @param dice3d
 */
export function registerDiceSoNice(dice3d) {
  dice3d.addSystem({ id: 'torgeternity', name: 'Torg Eternity' }, 'preferred'),
    dice3d.addDicePreset({
      type: 'd20',
      modelFile: 'systems/torgeternity/dice-models/torg-d20.glb',
      system: 'torgeternity',
    });
  dice3d.addDicePreset({
    type: 'd6',
    modelFile: 'systems/torgeternity/dice-models/torg-d6.glb',
    system: 'torgeternity',
  });
}
