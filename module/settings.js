import deckSettingMenu from './cards/cardSettingMenu.js';

/**
 *
 */
export function registerTorgSettings() {
  // --------welcome message
  const fields = foundry.data.fields;

  game.settings.register('torgeternity', 'welcomeMessage', {
    // game.setting.register("NameOfTheModule", "VariableName",
    name: 'torgeternity.settingMenu.welcome.name', // Register a module setting with checkbox
    hint: 'torgeternity.settingMenu.welcome.hint', // Description of the settings
    scope: 'world', // This specifies a client-stored setting
    config: true, // This specifies that the setting appears in the configuration view
    type: Boolean,
    default: true, // The default value for the setting
  });

  game.settings.register('torgeternity', 'y1pp', {
    name: 'torgeternity.settingMenu.useYear1PPTent.name',
    hint: 'torgeternity.settingMenu.useYear1PPTent.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true,
  });

  // ---------Set up Cards
  game.settings.register('torgeternity', 'setUpCards', {
    name: 'torgeternity.settingMenu.setupCards.name', // Register a module setting with checkbox
    hint: 'torgeternity.settingMenu.setupCards.hint', // Description of the settings
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });

  // GM Screen
  game.settings.register('torgeternity', 'gmScreen', {
    name: 'torgeternity.settingMenu.gmScreen.name', // Register a module setting with checkbox
    hint: 'torgeternity.settingMenu.gmScreen.hint', // Description of the settings
    scope: 'world',
    config: true,
    type: String,
    choices: CONFIG.torgeternity.availableScreens,
    default: 'none',
  });

  // Hide Compendiums
  game.settings.register('torgeternity', 'hideForeignCompendium', {
    name: 'torgeternity.settingMenu.hideForeignCompendium.name', // Register a module setting with checkbox
    hint: 'torgeternity.settingMenu.hideForeignCompendium.hint', // Description of the settings
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  // Show always details in Chatcards or keep it tugged in
  game.settings.register('torgeternity', 'showCheckDetails', {
    name: 'torgeternity.settingMenu.showCheckDetails.name',
    hint: 'torgeternity.settingMenu.showCheckDetails.hint',
    scope: 'client',
    config: true,
    requiresReload: true,
    type: Boolean,
    default: false,
    requiresReload: true,
  });

  // Show always details in Chatcards or keep it tugged in
  game.settings.register('torgeternity', 'cardChatNotify', {
    name: 'torgeternity.settingMenu.cardChatNotify.name',
    hint: 'torgeternity.settingMenu.cardChatNotify.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: value => game.torgeternity.cardChatOptions = { chatNotification: !value }
  });
  game.torgeternity.cardChatOptions = { chatNotification: !game.settings.get('torgeternity', 'cardChatNotify') }

  game.settings.register('torgeternity', 'useColorBlindnessColors', {
    name: 'torgeternity.settingMenu.useColorBlindnessColors.name',
    hint: 'torgeternity.settingMenu.useColorBlindnessColors.hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('torgeternity', 'useRenderedTorgDice', {
    name: 'torgeternity.settingMenu.useRenderedTorgDice.name',
    hint: 'torgeternity.settingMenu.useRenderedTorgDice.hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register('torgeternity', 'autoDamages', {
    name: 'torgeternity.settingMenu.autoDamages.name', // Register a module setting with checkbox
    hint: 'torgeternity.settingMenu.autoDamages.hint', // Description of the settings
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  // the deck setting menu
  game.settings.registerMenu('torgeternity', 'cardDecks', {
    name: 'torgeternity.settingMenu.deckSetting.name',
    label: 'torgeternity.settingMenu.deckSetting.label', // The text label used in the button
    hint: 'torgeternity.settingMenu.deckSetting.hint',
    icon: 'fas fa-bars',
    title: 'torgeternity.settingMenu.deckSetting.name', // A Font Awesome icon used in the submenu button
    type: deckSettingMenu, // A FormApplication subclass
    restricted: true, // only GM can manage default decks
  });

  // the deck setting
  game.settings.register('torgeternity', 'deckSetting', {
    scope: 'world',
    config: false,
    type: Object,
    default: {
      destinyDeck: 'Destiny Deck',
      destinyDiscard: 'Destiny Discard',
      dramaDeck: 'Drama Deck',
      dramaActive: 'Active Drama Card',
      dramaDiscard: 'Drama Discard',
      cosmDiscard: 'Cosm Discard',
      coreEarth: 'Core Earth Cosm Deck',
      aysle: 'Aysle Cosm Deck',
      cyberpapacy: 'Cyberpapacy Cosm Deck',
      livingLand: 'Living Land Cosm Deck',
      nileEmpire: 'Nile Empire Cosm Deck',
      orrorsh: 'Orrorsh Cosm Deck',
      panPacifica: 'Pan Pacifica Cosm Deck',
      tharkold: 'Tharkold Cosm Deck',
      stormknights: {},
    },
  });

  // disabling the clearance and XP for players
  // ---------Set up Cards
  game.settings.register('torgeternity', 'disableXP', {
    name: 'torgeternity.settingMenu.disableXP.name', // Register a module setting with checkbox
    hint: 'torgeternity.settingMenu.disableXP.hint', // Description of the settings
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('torgeternity', 'playerHandBottom', {
    name: 'torgeternity.settingMenu.playerHandBottom.name',
    hint: 'torgeternity.settingMenu.playerHandBottom.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('torgeternity', 'migrationVersion', {
    scope: 'world',
    config: false,
    type: String,
    default: '1.0.0',
  });

  // Hidden setting to determine whether module image updates are needed after migrating system images on intial update
  game.settings.register('torgeternity', 'moduleImageUpdate', {
    scope: 'world',
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register('torgeternity', 'uniqueDN', {
    name: 'torgeternity.settingMenu.uniqueDN.name',
    hint: 'torgeternity.settingMenu.uniqueDN.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('torgeternity', 'unTarget', {
    name: 'torgeternity.settingMenu.unTarget.name',
    hint: 'torgeternity.settingMenu.unTarget.hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register('torgeternity', 'shuffleMessageSurpress', {
    name: 'torgeternity.settingMenu.shuffleMessageSurpress.name',
    hint: 'torgeternity.settingMenu.shuffleMessageSurpress.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register('torgeternity', 'ignoreAmmo', {
    name: 'torgeternity.settingMenu.ignoreAmmo.name',
    hint: 'torgeternity.settingMenu.ignoreAmmo.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true,
  });

  game.settings.register('torgeternity', 'autoShock', {
    name: 'torgeternity.settingMenu.autoShock.name',
    hint: 'torgeternity.settingMenu.autoShock.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register('torgeternity', 'autoWound', {
    name: 'torgeternity.settingMenu.autoWound.name',
    hint: 'torgeternity.settingMenu.autoWound.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register('torgeternity', 'autoDisconnect', {
    name: 'torgeternity.settingMenu.autoDisconnect.name',
    hint: 'torgeternity.settingMenu.autoDisconnect.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register('torgeternity', 'disableDynamicRingOnImport', {
    name: 'torgeternity.settingMenu.disableDynamicRingOnImport.name',
    hint: 'torgeternity.settingMenu.disableDynamicRingOnImport.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register('torgeternity', 'showPiety', {
    name: 'torgeternity.settingMenu.showPiety.name',
    hint: 'torgeternity.settingMenu.showPiety.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register('torgeternity', 'itemPurchaseCosm', {
    name: 'torgeternity.settingMenu.itemPurchaseCosm.name',
    hint: 'torgeternity.settingMenu.itemPurchaseCosm.hint',
    scope: 'world',
    config: true,
    type: String,
    choices: CONFIG.torgeternity.itemPurchaseCosm,
    default: 'free'
  });

  game.settings.register('torgeternity', 'hoverDistance', {
    name: 'torgeternity.settingMenu.hoverDistance.name',
    hint: 'torgeternity.settingMenu.hoverDistance.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register('torgeternity', 'showMovementRuler', {
    name: 'torgeternity.settingMenu.showMovementRuler.name',
    hint: 'torgeternity.settingMenu.showMovementRuler.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true,
  });
  // Disable TokenRuler if not required
  if (!game.settings.get('torgeternity', 'showMovementRuler'))
    CONFIG.Token.rulerClass = null;

  game.settings.register('torgeternity', 'rulerGridWalk', {
    name: 'torgeternity.settingMenu.rulerGridWalk.name',
    hint: 'torgeternity.settingMenu.rulerGridWalk.hint',
    scope: 'world',
    config: true,
    type: new fields.ColorField(),
    default: 0x26b231  // --color-level-success
  });

  game.settings.register('torgeternity', 'rulerGridRun', {
    name: 'torgeternity.settingMenu.rulerGridRun.name',
    hint: 'torgeternity.settingMenu.rulerGridRun.hint',
    scope: 'world',
    config: true,
    type: new fields.ColorField(),
    default: 0x59a1f6  // --color-level-info
  });

  game.settings.register('torgeternity', 'rulerGridMax', {
    name: 'torgeternity.settingMenu.rulerGridMax.name',
    hint: 'torgeternity.settingMenu.rulerGridMax.hint',
    scope: 'world',
    config: true,
    type: new fields.ColorField(),
    default: 0xce0707  // --color-level-error
  });
}
