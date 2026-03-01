import TorgeternityActor from './documents/actor/torgeternityActor.js';

/**
 *
 */
export default function initTorgControlButtons() {
  // adding layer control for Torg entities
  /**
   *
   */
  CONFIG.Canvas.layers.torgeternity = { layerClass: foundry.canvas.layers.ControlsLayer, group: 'primary' };

  Hooks.on('renderSceneControls', (sceneControls, html, context, options) => {
    // getSceneControlButtons doesn't allow an IMG for the button.
    //if (!options.isFirstRender) return;

    const parent = html.querySelector('button[data-control="torg"]');
    if (!parent || parent.hasChildNodes()) return;

    const image = document.createElement('img');
    image.classList.add('torgIcon');
    image.src = 'systems/torgeternity/images/te-logo.webp';
    parent.appendChild(image);
  })

  Hooks.on('getSceneControlButtons', (controls) => {

    controls.torg = {
      name: 'torg',
      title: 'TORG',
      icon: 'torg',  // background set to the correct image via CSS
      layer: 'torgeternity',
      //activeTool: "playerHand",  // It will trigger the tool button!
      tools: {
        playerHand:
        {
          name: 'playerHand',
          order: 1,
          title: 'TYPES.Cards.hand',
          icon: 'fa fa-id-badge',
          toggle: true,
          onChange: (event, active) => {
            const hand = TorgeternityActor.getControlledActor()?.getDefaultHand();
            if (!hand) return ui.notifications.error(game.i18n.localize('torgeternity.notifications.noHands'));
            setWindowState(hand.sheet, active);
          },
        },
        gmScreen:
        {
          name: 'gmScreen',
          order: 2,
          title: 'torgeternity.gmScreen.toggle',
          icon: 'fa fa-book-open',
          toggle: true,
          visible: game.user.isGM,
          onChange: (event, active) => setWindowState(ui.GMScreen, active)
        },
        deckSettings:
        {
          name: 'deckSettings',
          order: 3,
          title: 'torgeternity.settingMenu.deckSetting.name',
          icon: 'fa fa-cog',
          toggle: true,
          visible: game.user.isGM,
          onChange: (event, active) => setWindowState(ui.deckSettings, active),
        },
        macroHub:
        {
          name: 'macroHub',
          order: 4,
          title: 'torgeternity.macros.macroHub.buttonTitle',
          icon: 'fa-solid fa-bottle-water',
          toggle: true,
          visible: game.user.isGM,
          onChange: (event, active) => setWindowState(ui.macroHub, active),
        }
      }
    };
  });
}


function setWindowState(window, active) {
  if (!active) return window.close();

  if (!window.rendered)
    return window.render({ force: true });
  else if (window._minimized)
    return window.maximize();
}

function setControlsToggle(name, active) {
  const controls = foundry.ui.controls
  controls.controls.torg.tools[name].active = active;
  const button = controls.element.querySelector(`button.tool[data-tool="${name}"]`);
  button?.setAttribute("aria-pressed", active ? "true" : "false");
}

Hooks.on('renderDeckSettingMenu', () => setControlsToggle("deckSettings", true))
Hooks.on('renderGMScreen', () => setControlsToggle("gmScreen", true))
Hooks.on('renderMacroHub', () => setControlsToggle("macroHub", true))

Hooks.on('closeDeckSettingMenu', () => setControlsToggle("deckSettings", false))
Hooks.on('closeGMScreen', () => setControlsToggle("gmScreen", false))
Hooks.on('closeMacroHub', () => setControlsToggle("macroHub", false))

Hooks.on('rendertorgeternityPlayerHand', (hand, element, context, options) => {
  const ownHand = TorgeternityActor.getControlledActor()?.getDefaultHand();
  if (hand.document === ownHand) setControlsToggle("playerHand", true)
})
Hooks.on('closetorgeternityPlayerHand', (hand) => {
  const ownHand = TorgeternityActor.getControlledActor()?.getDefaultHand();
  if (hand.document === ownHand) setControlsToggle("playerHand", false)
})