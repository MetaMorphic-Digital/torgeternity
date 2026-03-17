import { PossibilityByCosm } from './possibilityByCosm.js';
import TorgeternityActor from './documents/actor/torgeternityActor.js';

/**
 *
 */
export default function createTorgShortcuts() {
  // creating keyboard shortcuts
  game.keybindings.register('torgeternity', 'openHand', {
    name: 'torgeternity.dialogPrompts.openHand',
    editable: [{
      key: 'KeyH'
    },],
    onDown: () => TorgeternityActor.getControlledActor()?.getDefaultHand().sheet.toggleRender(),
  });
  game.keybindings.register('torgeternity', 'openHands', {
    name: 'torgeternity.dialogPrompts.openHands',
    editable: [{
      key: 'KeyH',
      modifiers: ["Shift"]
    },],
    onDown: () => ui.handsViewer.toggleRender(),
  });
  game.keybindings.register('torgeternity', 'openGMScreen', {
    name: 'torgeternity.gmScreen.toggle',
    editable: [{ key: 'KeyG', },],
    restricted: true,
    onDown: () => ui.GMScreen.toggleRender(),
  });
  game.keybindings.register('torgeternity', 'openCosmPoss', {
    name: 'Possibility by cosm', // game.i18n.localize("torgeternity.gmScreen.toggle"),
    editable: [{ key: 'KeyP', },],
    onDown: (context) => {
      const actor = TorgeternityActor.getControlledActor();
      if (actor) PossibilityByCosm.toggleRender(actor);
    },
  });
}
