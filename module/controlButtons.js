import TorgeternityActor from './documents/actor/torgeternityActor.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api


export class TorgControlButtons extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'torg-control-buttons',
    classes: ['torgeternity', 'effects-panel', 'themed', 'theme-dark'],
    window: {
      contentClasses: ['standard-form'],
      frame: false,
      minimizable: false,
      resizable: false,
      positioned: false,
    },
    actions: {
      onPress: TorgControlButtons.#onPress,
    },
    buttons: [
      {
        name: 'playerHand',
        label: 'TYPES.Cards.hand',
        icon: 'fa fa-id-badge',
        type: 'toggle',
        callback: (button, active) => {
          const hand = TorgeternityActor.getControlledActor()?.getDefaultHand();
          if (!hand) return ui.notifications.error(game.i18n.localize('torgeternity.notifications.noHands'));
          setWindowState(hand.sheet, active);
        },
      },
      {
        name: 'handsViewer',
        label: 'DOCUMENT.CardsPlural',
        icon: 'fa fa-window-restore',
        type: 'toggle',
        callback: (button, active) => setWindowState(ui.handsViewer, active)
      },
      {
        name: 'gmScreen',
        label: 'torgeternity.gmScreen.toggle',
        icon: 'fa fa-book-open',
        type: 'toggle',
        visible: () => game.user.isGM,
        callback: (button, active) => setWindowState(ui.GMScreen, active)
      },
      {
        name: 'deckSettings',
        label: 'torgeternity.settingMenu.deckSetting.name',
        icon: 'fa fa-cog',
        type: 'toggle',
        visible: () => game.user.isGM,
        callback: (button, active) => setWindowState(ui.deckSettings, active),
      },
      {
        name: 'macroHub',
        label: 'torgeternity.macros.macroHub.buttonTitle',
        icon: 'fa-solid fa-bottle-water',
        type: 'toggle',
        visible: () => game.user.isGM,
        callback: (button, active) => setWindowState(ui.macroHub, active),
      },
      {
        name: 'd20poss',
        label: 'torgeternity.sheetLabels.roll',
        icon: 'fa-solid fa-dice-d20',
        type: 'button',
        callback: async (button, active) => {
          const diceroll = await foundry.dice.Roll.create('1d20x10x20').evaluate();

          return ChatMessage.create({
            rolls: diceroll
          })
        }
      },
      {
        name: 'bonusDie',
        label: 'torgeternity.chatText.bonusDice',
        icon: 'fa-solid fa-dice-five',
        type: 'button',
        callback: (button, active) => game.torgeternity.macros.rollBDs()
      },
    ]
  }

  static PARTS = {
    body: { template: 'systems/torgeternity/templates/control-buttons.hbs', scrollable: [""] },
  }

  constructor(options) {
    super(options);
    TorgControlButtons.panel = this;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.buttons = TorgControlButtons.DEFAULT_OPTIONS.buttons.filter(button => button.visible ? button.visible() : true)
    context.tooltipDirection = foundry.helpers.interaction.TooltipManager.TOOLTIP_DIRECTIONS.LEFT;
    return context;
  }

  _insertElement(element) {
    const existing = document.getElementById(element.id);
    if (existing) existing.replaceWith(element);
    else
      ui.sidebar.element.prepend(element);
  }

  static async #onPress(event, button) {
    let newstate = false;
    if (button.classList.contains('toggle'))
      newstate = button.getAttribute('aria-pressed') === 'true' ? false : true;
    return TorgControlButtons.DEFAULT_OPTIONS.buttons.find(b => b.name === button.name)?.callback(button, newstate);
  }

  async setControlsToggle(name, active) {
    const button = this.element.querySelector(`button[name="${name}"]`);
    if (button && button.classList.contains('toggle'))
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
  }
}

function setWindowState(window, active) {
  if (!active) return window.close();
  if (!window.rendered) return window.render({ force: true });
  if (window.minimized) return window.maximize();
}


Hooks.on('renderDeckSettingMenu', () => ui.torgControlButtons.setControlsToggle("deckSettings", true))
Hooks.on('renderGMScreen', () => ui.torgControlButtons.setControlsToggle("gmScreen", true))
Hooks.on('renderMacroHub', () => ui.torgControlButtons.setControlsToggle("macroHub", true))
Hooks.on('renderHandsManager', () => ui.torgControlButtons.setControlsToggle("handsViewer", true))

Hooks.on('closeDeckSettingMenu', () => ui.torgControlButtons.setControlsToggle("deckSettings", false))
Hooks.on('closeGMScreen', () => ui.torgControlButtons.setControlsToggle("gmScreen", false))
Hooks.on('closeMacroHub', () => ui.torgControlButtons.setControlsToggle("macroHub", false))
Hooks.on('closeHandsManager', () => ui.torgControlButtons.setControlsToggle("handsViewer", false))

Hooks.on('rendertorgeternityPlayerHand', (hand, element, context, options) => {
  const ownHand = TorgeternityActor.getControlledActor()?.getDefaultHand();
  if (hand.document === ownHand) ui.torgControlButtons.setControlsToggle("playerHand", true)
})
Hooks.on('closetorgeternityPlayerHand', (hand) => {
  const ownHand = TorgeternityActor.getControlledActor()?.getDefaultHand();
  if (hand.document === ownHand) ui.torgControlButtons.setControlsToggle("playerHand", false)
})