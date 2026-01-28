import PartySheet from './partySheet.js';

const { DialogV2 } = foundry.applications.api;

/**
 *
 */
export default class TorgeternityPlayerList extends foundry.applications.ui.Players {

  static DEFAULT_OPTIONS = {
    classes: ['torgeternity', 'themed', 'theme-dark'],
    actions: {
      partySheet: PartySheet.showParty,
      possAdd: TorgeternityPlayerList.#onAddPossibility,
      possMinus: TorgeternityPlayerList.#onMinusPossibility,
      possAddGM: TorgeternityPlayerList.#onAddPossibilityGM,
      possMinusGM: TorgeternityPlayerList.#onMinusPossibilityGM,
      possReset: TorgeternityPlayerList.#onResetPossibilities
    }
  }
  static PARTS = {
    players: {
      root: true,
      // override core "templates/ui/players.hbs"
      template: 'systems/torgeternity/templates/playerList/playerList.hbs'
    }
  }
  /**
   *
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.self = game.user;
    context.GMpossibilities = game.users.activeGM?.getFlag('torgeternity', 'GMpossibilities') ?? 0;

    for (const user of [...context.active, ...context.inactive]) {
      const userdoc = game.users.get(user.id);
      user.character = userdoc.character;
      user.isGM = userdoc.isGM;
      user.inactive = !userdoc.active;
      user.characterPossibilities = user.character?.system.other.possibilities.value ?? 0;
    }
    return context;
  }
  /**
   *
   * @param event
   */
  static async #onAddPossibility(event, button) {
    const targetActor = game.actors.get(button.dataset.targetId);
    return targetActor.update({ "system.other.possibilities.value": targetActor.system.other.possibilities.value + 1, });
  }
  static async #onAddPossibilityGM(event, button) {
    const gmuser = game.users.activeGM;
    const newVal = gmuser.getFlag('torgeternity', 'GMpossibilities') + 1;
    gmuser.setFlag('torgeternity', 'GMpossibilities', newVal);
  }
  /**
   *
   * @param event
   */
  static async #onMinusPossibility(event, button) {
    const targetActor = game.actors.get(button.dataset.targetId);
    return targetActor.update({ "system.other.possibilities.value": targetActor.system.other.possibilities.value - 1, });
  }
  static async #onMinusPossibilityGM(event, button) {
    const gmuser = game.users.activeGM;
    const newVal = gmuser.getFlag('torgeternity', 'GMpossibilities') - 1;
    gmuser.setFlag('torgeternity', 'GMpossibilities', newVal);
  }

  /**
   *
   * @param event
   */
  static #onResetPossibilities() {
    DialogV2.wait({
      window: {
        title: 'torgeternity.possibilitiesReset.name',
      },
      content: `<div><span>${game.i18n.localize('torgeternity.possibilitiesReset.hint')}
            <input id="possibilitiesValue" value="3" type="number"/>
            </span></div>`,
      buttons: [
        {
          action: 'submit',
          icon: 'fas fa-check',
          label: 'torgeternity.submit.apply',
          callback: (event, button, dialog) => {
            const newVal = parseInt(dialog.element.querySelector('[id=possibilitiesValue]').value);
            game.users.forEach((user) => {
              if (user.character) {
                user.character.update({ "system.other.possibilities.value": newVal });
              }
            });
          },
        },
        {
          action: 'cancel',
          icon: 'fas fa-ban',
          label: 'torgeternity.submit.cancel',
        },
      ],
    });
  }
}