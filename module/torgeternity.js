'use strict';
import { initConfig, torgeternity } from './config.js';
import TorgeternityChatLog from './torgeternityChatLog.js';
import TorgeternityItem from './documents/item/torgeternityItem.js';
import TorgeternityActor from './documents/actor/torgeternityActor.js';
import TorgeternityScene from './documents/torgeternityscene.js';
import TorgeternityItemSheet from './sheets/torgeternityItemSheet.js';
import TorgeternityActorSheet from './sheets/torgeternityActorSheet.js';
import { preloadTemplates } from './preloadTemplates.js';
import torgeternityCombat from './dramaticScene/torgeternityCombat.js';
import torgeternityCombatTracker from './dramaticScene/torgeternityCombatTracker.js';
// Disabling Player List extension until it can be updated for version 10
import TorgeternityPlayerList from './users/TorgeternityPlayerList.js';
import torgeternitySceneConfig from './torgeternitySceneConfig.js';
import torgeternityNav from './torgeternityNav.js';
import { registerTorgSettings } from './settings.js';
import { rollAttack, rollPower, TestResult } from './torgchecks.js';
import { modifyTokenBars } from './tokenBars.js';
import TorgCombatant from './dramaticScene/torgeternityCombatant.js';
import { registerDiceSoNice } from './dice-so-nice.js';
import torgeternityPlayerHand from './cards/torgeternityPlayerHand.js';
import torgeternityPile from './cards/torgeternityPile.js';
import torgeternityDeck from './cards/torgeternityDeck.js';
import torgeternityCardConfig from './cards/torgeternityCardConfig.js';
import { torgeternityCard } from './cards/torgeternityCard.js';
import { torgeternityCards } from './cards/torgeternityCards.js';
import { TestDialog } from './test-dialog.js';
import initTorgControlButtons from './controlButtons.js';
import createTorgShortcuts from './keybinding.js';
import GMScreen from './GMScreen.js';
import { setUpCardPiles } from './cards/setUpCardPiles.js';
import { explode, reroll } from './explode.js';
import { activateStandartScene } from './activateStandartScene.js';
import { torgMigration } from './migrations.js';
import initTextEdidor from './initTextEditor.js';
import initProseMirrorEditor from './initProseMirrorEditor.js';
import { TorgeternityMacros } from './macros.js';
import { ChatMessageTorg } from './documents/chat/chatMessageTorg.js';
import * as actorDataModels from './data/actor/index.js';
import * as itemDataModels from './data/item/index.js';
import * as cardDataModels from './data/card/index.js';
import { TorgActiveEffectData } from './data/active-effect.js';
import TorgActiveEffect from './documents/active-effect/torgActiveEffect.js';
import TorgActiveEffectConfig from './sheets/torgeternityActiveEffectConfig.js';
import TorgEternityTokenRuler from './canvas/tokenruler.js';
import TorgEternityToken from './canvas/torgeternityToken.js';
import MacroHub from './MacroHub.js';
import InitEnrichers from './enrichers.js';
import { initHideCompendium } from './hideCompendium.js';
import DeckSettingMenu from './cards/cardSettingMenu.js';
import activateSocketListeners from './sockets.js';

const { DialogV2 } = foundry.applications.api;

Hooks.once('init', async function () {
  console.log('torgeternity | Initializing Torg Eternity System');

  initConfig();

  // -------global
  game.torgeternity = {
    rollItemMacro,
    rollSkillMacro,
    macros: new TorgeternityMacros(),
  };
  initTextEdidor();
  initProseMirrorEditor();
  CONFIG.torgeternity = torgeternity;
  CONFIG.Item.documentClass = TorgeternityItem;
  CONFIG.Actor.documentClass = TorgeternityActor;
  CONFIG.ActiveEffect.documentClass = TorgActiveEffect;
  CONFIG.ActiveEffect.dataModels.base = TorgActiveEffectData;
  CONFIG.Actor.dataModels = actorDataModels.config;
  CONFIG.Item.dataModels = itemDataModels.config;
  CONFIG.Card.dataModels = cardDataModels.config;
  CONFIG.statusEffects = torgeternity.statusEffects;
  CONFIG.attributeTypes = torgeternity.attributeTypes;
  CONFIG.Token.rulerClass = TorgEternityTokenRuler;
  CONFIG.Token.objectClass = TorgEternityToken;
  CONFIG.Scene.documentClass = TorgeternityScene;

  // Indexable Compendiums
  CONFIG.Actor.compendiumIndexFields.push(
    'system.other.cosm', // CommonActorData
    'system.details.race', 'system.details.background', // StormKnightData
    'system.details.clearance', 'system.details.description', // ThreatData
    'system.type', 'system.description' // VehicleData
  );
  CONFIG.Item.compendiumIndexFields.push(
    'system.cosm', 'system.description', 'system.traits', // BaseItemData
    //'system.secondaryAxiom', // GeneralItemData (not a useful index key)
    'system.category', // Perks
    'system.notes', // Armor, BaseWeapon, Implant, Shield
    'system.implantType', // Implant
  );

  // --------combats
  CONFIG.Combat.initiative.formula = '1';
  CONFIG.Combat.documentClass = torgeternityCombat;
  CONFIG.ui.combat = torgeternityCombatTracker;
  CONFIG.Combatant.documentClass = TorgCombatant;
  CONFIG.ChatMessage.documentClass = ChatMessageTorg;

  // ----scenes
  // CONFIG.Scene.sheetClass = torgeternitySceneConfig;
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Scene, 'torgeternity', torgeternitySceneConfig, {
    label: 'Torg Eternity Scene Config',
    makeDefault: true,
  });
  CONFIG.ui.nav = torgeternityNav;

  // ---custom user class
  // Player list disabled for now
  CONFIG.ui.players = TorgeternityPlayerList;
  CONFIG.ui.chat = TorgeternityChatLog;

  // ---cards
  CONFIG.Card.documentClass = torgeternityCard;
  CONFIG.Cards.documentClass = torgeternityCards;
  CONFIG.cardTypes = torgeternity.cardTypes;

  ui.macroHub = new MacroHub();
  ui.GMScreen = new GMScreen();
  ui.deckSettings = new DeckSettingMenu();

  // all settings after config
  registerTorgSettings();
  // ---register items and actors
  foundry.documents.collections.Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet('torgeternity', TorgeternityItemSheet, {
    label: "Torg Eternity Item Sheet",
    makeDefault: true,
  });

  foundry.documents.collections.Actors.unregisterSheet('core', foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet('torgeternity', TorgeternityActorSheet, {
    label: "Torg Eternity Actor Sheet",
    makeDefault: true,
  });

  // ---register cards
  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(Cards, 'core', foundry.applications.sheets.CardHandConfig);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Cards, 'torgeternity', torgeternityPlayerHand, {
    label: 'Torg Eternity Player Hand',
    types: ['hand'],
    makeDefault: true,
  });
  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(Cards, 'core', foundry.applications.sheets.CardPileConfig);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Cards, 'torgeternity', torgeternityPile, {
    label: 'Torg Eternity Pile',
    types: ['pile'],
    makeDefault: true,
  });
  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(Cards, 'core', foundry.applications.sheets.CardDeckConfig);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Cards, 'torgeternity', torgeternityDeck, {
    label: 'Torg Eternity Deck',
    types: ['deck'],
    makeDefault: true,
  });
  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(Card, 'core', foundry.applications.sheets.CardConfig);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Card, 'torgeternity', torgeternityCardConfig, {
    label: 'Torg Eternity Card Configuration',
    types: ['destiny', 'drama', 'cosm'],
    makeDefault: true,
  });
  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(ActiveEffect, 'core', foundry.applications.sheets.ActiveEffectConfig);
  foundry.applications.apps.DocumentSheetConfig.registerSheet(ActiveEffect, 'torgeternity', TorgActiveEffectConfig, {
    label: 'Torg Active Effect Configuration',
    makeDefault: true,
  });

  // All choices must use strings, since number 0 will be treated as undefined by {{radioBoxes}}
  CONFIG.torgeternity.choices = {
    calledShot: {
      [0]: 'torgeternity.sheetLabels.none',
      [-2]: '-2',
      [-4]: '-4',
      [-6]: '-6',
    },
    burst: {
      [0]: 'torgeternity.sheetLabels.none',
      [2]: 'torgeternity.sheetLabels.shortBurst',
      [4]: 'torgeternity.sheetLabels.longBurst',
      [6]: 'torgeternity.sheetLabels.heavyBurst',
    },
    addBDs: [0, 1, 2, 3, 4, 5],
    movement: {
      [0]: 'torgeternity.sheetLabels.walking',
      [-2]: 'torgeternity.sheetLabels.running',
    },
    multipleActions: {
      [0]: '1',
      [-2]: '2',
      [-4]: '3',
      [-6]: '4',
    },
    targets: {
      [0]: '1',
      [-2]: '2',
      [-4]: '3',
      [-6]: '4',
      [-8]: '5',
      [-10]: '6',
    },
    concealment: {
      [0]: 'torgeternity.sheetLabels.none',
      [-2]: '-2',
      [-4]: '-4',
      [-6]: '-6',
    }
  }

  // ----------preloading handlebars templates
  preloadTemplates();
  // adding special torg buttons
  initTorgControlButtons();
  // create torg shortcuts
  createTorgShortcuts();

  // Foundry#initializePacks is called just before the 'setup' hook
  // But needs to be after 'ready' to set properties on compendiums.
  initHideCompendium();

  // Fixed strings needed for Data Models
  CONFIG.torgeternity.testOutcomeLabel = {
    [TestResult.UNKNOWN]: "",
    [TestResult.MISHAP]: 'torgeternity.chatText.check.result.mishape',
    [TestResult.FAILURE]: 'torgeternity.chatText.check.result.failure',
    [TestResult.STANDARD]: 'torgeternity.chatText.check.result.standardSuccess',
    [TestResult.GOOD]: 'torgeternity.chatText.check.result.goodSuccess',
    [TestResult.OUTSTANDING]: 'torgeternity.chatText.check.result.outstandingSuccess'
  }

  // ---Core Foundry expects typeLabels to be translation keys
  CONFIG.Actor.typeLabels = {
    stormknight: 'TYPES.Actor.stormknight',
    threat: 'TYPES.Actor.threat',
    vehicle: 'TYPES.Actor.vehicle',
  };
  CONFIG.Item.typeLabels = {
    ammunition: 'torgeternity.itemSheetDescriptions.ammunition',
    gear: 'torgeternity.itemSheetDescriptions.generalGear',
    currency: 'torgeternity.itemSheetDescriptions.currency',
    eternityshard: 'torgeternity.itemSheetDescriptions.eternityshard',
    armor: 'torgeternity.itemSheetDescriptions.armor',
    shield: 'torgeternity.itemSheetDescriptions.shield',
    customAttack: 'torgeternity.itemSheetDescriptions.customAttack',
    meleeweapon: 'torgeternity.itemSheetDescriptions.meleeWeapon',
    missileweapon: 'torgeternity.itemSheetDescriptions.missileWeapon',
    firearm: 'torgeternity.itemSheetDescriptions.firearm',
    implant: 'torgeternity.itemSheetDescriptions.implant',
    heavyweapon: 'torgeternity.itemSheetDescriptions.heavyWeapon',
    vehicle: 'torgeternity.itemSheetDescriptions.vehicle',
    perk: 'torgeternity.itemSheetDescriptions.perk',
    enhancement: 'torgeternity.itemSheetDescriptions.enhancement',
    specialability: 'torgeternity.itemSheetDescriptions.specialability',
    'specialability-rollable': 'torgeternity.itemSheetDescriptions.specialabilityRollable',
    spell: 'torgeternity.itemSheetDescriptions.spell',
    miracle: 'torgeternity.itemSheetDescriptions.miracle',
    psionicpower: 'torgeternity.itemSheetDescriptions.psionicpower',
    customSkill: 'torgeternity.itemSheetDescriptions.customSkill',
    vehicleAddOn: 'torgeternity.itemSheetDescriptions.vehicleAddOn',
    race: 'torgeternity.itemSheetDescriptions.race',
  };

  // Hard-coded, so that we are guaranteed to have it available immediately
  CONFIG.torgeternity.cosmTypeFromLabel = {
    "(Keins)": "none",
    "(Ninguno)": "none",
    "(Non)": "none",
    "(None)": "none",
    "(Sans cosm)": "none",
    "Andere": "other",
    "Autre": "other",
    "Aysle": "aysle",
    "Ciberpapado": "cyberpapacy",
    "Core Earth": "coreEarth",
    "Cyberpapacy": "cyberpapacy",
    "Cyberpapauté": "cyberpapacy",
    "Cyberpontifikat": "cyberpapacy",
    "Das Lebende Land": "livingLand",
    "Empire du Nil": "nileEmpire",
    "Imperio Nilo": "nileEmpire",
    "Living Land": "livingLand",
    "Nil Imperium": "nileEmpire",
    "Nil-Imperium": "nileEmpire",
    "Nile Empire": "nileEmpire",
    "Orrorsh": "orrorsh",
    "Other": "other",
    "Otro": "other",
    "Pan Pacifica": "panPacifica",
    "Prime Terre": "coreEarth",
    "Terre-Vivante": "livingLand",
    "Terre vivante": "livingLand",
    "Terre Vivante": "livingLand",
    "Tharkold": "tharkold",
    "Tierra Base": "coreEarth",
    "Tierra Viviente": "livingLand",
    "Zentralerde": "coreEarth",
  }

});

Hooks.once('i18nInit', () => {
  // Translate number magnitude strings (fast lookup for GeneralItemData.prepareBaseData)
  CONFIG.torgeternity.magnitudeLabels = {};
  for (const [key, value] of Object.entries(CONFIG.torgeternity.magnitudes))
    CONFIG.torgeternity.magnitudeLabels[key] = game.i18n.localize(value);
})

Hooks.once('setup', async function () {

  // Choose the best document type for creation (minimise clicks)
  CONFIG.Actor.defaultType = (game.user.isGM) ? "threat" : "stormknight";

  modifyTokenBars();
  InitEnrichers();
  // changing stutus marker
  // preparing status marker

  if (game.settings.get('core', 'language') === 'fr') {
    for (const effect of CONFIG.statusEffects) {
      effect.img = effect.img.replace(
        'systems/torgeternity/images/status-markers',
        'systems/torgeternity/images/status-markers/fr'
      );
    }
  }

  Handlebars.registerHelper({ TorgRadioBoxesNumber })
  Handlebars.registerHelper({ TorgHidden })
  Handlebars.registerHelper({ TorgDisconnected })
  Handlebars.registerHelper({ TorgIsSvg })

  // Ensure all Actor & Item packs have the updated index contents
  for (const pack of game.packs) {
    if (pack.metadata.type === 'Actor' || pack.metadata.type === 'Item')
      await pack.getIndex();
  }
});

Hooks.once('diceSoNiceReady', (dice3d) => {
  registerDiceSoNice(dice3d);
});

// -------------once everything ready
Hooks.on('ready', async function () {

  // migration script
  if (game.user.isGM) torgMigration();

  // monkey-patch explosion method for die rolls
  foundry.dice.terms.Die.prototype.explode = explode;
  foundry.dice.terms.Die.prototype.reroll = reroll;

  // adding gmScreen to UI
  ui.GMScreen = new GMScreen();

  // Set default time for combat (in seconds)
  CONFIG.time.turnTime = 0;
  CONFIG.time.roundTime = 10;

  // -----applying GM possibilities pool if absent
  if (game.user.isGM && !game.user.getFlag('torgeternity', 'GMpossibilities')) {
    game.user.setFlag('torgeternity', 'GMpossibilities', 0);
  }

  // ----load template for welcome message depending on supported languages
  let lang = game.settings.get('core', 'language');
  if (torgeternity.supportedLanguages.indexOf(lang) === -1) lang = 'en';

  torgeternity.welcomeMessage = await foundry.applications.handlebars.renderTemplate(
    `systems/torgeternity/templates/welcomeMessage/${lang}.hbs`
  );
  // Provide function to show the welcome message at any time.
  game.torgeternity.showWelcomeMessage = showWelcomeMessage;

  // ----rendering welcome message
  if (game.settings.get('torgeternity', 'welcomeMessage') === true) {
    showWelcomeMessage();
  }

  // ------Ask about hiding nonlocal compendium
  if (
    game.settings.get('torgeternity', 'welcomeMessage') === true &&
    !game.settings.get('torgeternity', 'hideForeignCompendium')
  ) {
    DialogV2.confirm({
      window: { title: 'torgeternity.dialogWindow.hideForeignCompendium.title', },
      content: game.i18n.localize('torgeternity.dialogWindow.hideForeignCompendium.content'),
      yes: {
        icon: 'fas fa-check',
        label: 'torgeternity.yesNo.true',
        callback: async () => {
          await game.settings.set('torgeternity', 'hideForeignCompendium', true);
          window.location.reload();
        },
      },
      no: {
        icon: 'fas fa-ban',
        label: 'torgeternity.yesNo.false',
      },
      position:
      {
        top: 100,
        left: 235,
      }
    });
  }

  // ----setup cards if needed
  if (game.settings.get('torgeternity', 'setUpCards') === true && game.user.isGM) {
    await setUpCardPiles();
  }

  // ----reset cards to initial face
  if (game.user.isGM)
    game.cards.forEach(deck => deck.cards.forEach(card => card.update({ face: 0 })));

  // activation of standard scene
  if (game.scenes.size < 1) {
    activateStandartScene();
  }

  activateSocketListeners();
});

let externalLinks;

Hooks.on("renderSettings", async (app, html) => {
  const systemRow = html.querySelectorAll("section.info .system")?.[0];
  if (!systemRow) {
    console.warn('No system button available for links');
    return;
  }
  let button = document.createElement("button");
  button.type = "button";
  button.style.height = "auto";
  button.dataset.action = "showTorgLinks";

  const icon = document.createElement("img");
  icon.setAttribute('src', 'systems/torgeternity/images/te-logo.webp');
  icon.inert = true;
  button.append(icon);
  systemRow.insertAdjacentElement("afterend", button);

  button.addEventListener('click', () => {
    // Create dialog if not done yet
    if (!externalLinks) {
      const dialogOptions = {
        classes: ['torgeternity', 'themed', 'theme-dark', 'externalLinks'],
        window: {
          title: 'torgeternity.dialogWindow.externalLinks.title',
        },
        position: {
          left: 100,
          top: 20,
        },
        content: game.i18n.localize('torgeternity.dialogWindow.externalLinks.content'),
        buttons: [
          {
            action: 'reference',
            icon: 'fa-solid fa-expand-arrows-alt',
            label: 'torgeternity.dialogWindow.externalLinks.reference',
            callback: () => {
              // We can only inline when the Foundry server is running on HTTP, not HTTPS
              if (location.protocol === 'https:') {
                ui.notifications.info(game.i18n.localize('torgeternity.notifications.openReference'));
                window.open('http://torg-gamereference.com/index.php', '_blank');
              } else {
                new foundry.applications.sidebar.apps.FrameViewer({  // will be removed in Foundry V15
                  url: 'http://torg-gamereference.com/index.php',
                  window: {
                    title: 'torg game reference',
                    resizable: true,
                  },
                  position: {
                    top: 200,
                    left: 200,
                    width: 520,
                    height: 520,
                  }
                }).render({ force: true });
              }
            },
          },
          {
            action: 'discord',
            icon: 'fab fa-discord',
            label: 'Discord',
            callback: () => {
              ui.notifications.info(game.i18n.localize('torgeternity.notifications.openDiscord'));
              window.open('https://discord.gg/foundryvtt', '_blank');
            },
          },
          {
            action: 'bug',
            icon: 'fa-solid fa-bug',
            label: 'torgeternity.dialogWindow.externalLinks.bug',
            callback: () => {
              ui.notifications.info(game.i18n.localize('torgeternity.notifications.openIssue'));
              window.open('https://github.com/gmmatt/torgeternity/issues/new', '_blank');
            },
          },
          {
            action: 'publisher',
            cls: 'publisher',
            icon: 'systems/torgeternity/images/ulissesLogo.webp', // not FA so ignored
            label: 'torgeternity.dialogWindow.externalLinks.publisher',
            callback: () => {
              ui.notifications.info(game.i18n.localize('torgeternity.notifications.openUlisses'));
              window.open('https://ulisses-us.com', '_blank');
            },
          },
        ],
      };

      // adding french links (shamelessly)
      if (game.settings.get('core', 'language') === 'fr') {
        dialogOptions.buttons.push({
          icon: 'systems/torgeternity/images/BBE_logo.webp', // not FA so ignored
          label: '<p>Distr. français</p>',
          callback: () => {
            ui.notifications.info(
              'votre navigateur va ouvrir le site de BlackBook Editions dans un nouvel onglet  '
            );
            window.open('https://www.black-book-editions.fr/catalogue.php?id=668', '_blank');
          },
        });
      }
      externalLinks = new DialogV2(dialogOptions);
    }

    externalLinks.render({ force: true })
  })
})

// moved out of the setup hook, because it had no need to be in there
Hooks.on('hotbarDrop', (bar, dropData, slot) => {
  // return true means we are not handling this event, false means we did handle it
  if (
    dropData.type !== 'Item' &&
    dropData.type !== 'skill' &&
    dropData.type !== 'interaction' &&
    dropData.type !== 'attribute'
  )
    return true;

  createTorgEternityMacro(dropData, slot);
  return false;
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

async function createTorgEternityMacro(dropData, slot) {
  const document = dropData.uuid ? fromUuidSync(dropData.uuid) : dropData.data;
  // Create the macro command
  let command = null;
  let macro = null;
  let macroName = null;
  let macroImg = null;

  if (dropData.type === 'Item') {
    command = `game.torgeternity.rollItemMacro("${document.name}");`;
    macroName = document.name;
    macroImg = document.img;
  } else {
    // attribute, skill, interaction
    const dropName = document.name;
    const dropAttribute = document.attribute;
    const isInteractionAttack = dropData.type === 'interaction';

    command = `game.torgeternity.rollSkillMacro("${dropName}", "${dropAttribute}", ${isInteractionAttack});`;

    const locSkillName = dropData.data.customskill ? dropName : (dropName !== dropAttribute) && game.i18n.localize('torgeternity.skills.' + dropName);
    const locAttributeName = game.i18n.localize('torgeternity.attributes.' + dropAttribute);

    if (dropData.type === 'skill')
      macroName = locSkillName + '/' + locAttributeName;
    else if (dropData.type === 'attribute')
      macroName = locAttributeName;
    else if (dropData.type === 'interaction')
      macroName = locSkillName;

    if (dropData.type === 'attribute') {
      // this is an attribute test
      // use built-in foundry icons
      if (dropAttribute === 'charisma')
        macroImg = 'icons/skills/social/diplomacy-handshake.webp';
      else if (dropAttribute === 'dexterity')
        macroImg = 'icons/skills/movement/feet-winged-boots-brown.webp';
      else if (dropAttribute === 'mind')
        macroImg = 'icons/sundries/books/book-stack.webp';
      else if (dropAttribute === 'spirit')
        macroImg = 'icons/magic/life/heart-shadow-red.webp';
      else if (dropAttribute === 'strength')
        macroImg = 'icons/magic/control/buff-strength-muscle-damage.webp';
    } else {
      // not attribute test
      // don't have skill icons yet
      // macroImg = "systems/torgeternity/images/icons/skill-" + internalSkillName + "-icon.png";
    }
  }

  macro = game.macros.find((m) => m.name === macroName && m.command === command);
  if (!macro) {
    // there is a difference between img: null or img: "" and not including img at all
    // the latter results in default macro icon, the others give broken image icon
    // can remove this when we have skill icons
    const macroData = {
      name: macroName,
      type: 'script',
      command: command,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
    };
    if (macroImg) macroData.img = macroImg;

    macro = await Macro.create(macroData);
  }

  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Triggered to roll for an item on the caller's default character.
 *
 * @param {string} itemName
 * @returns {Promise}
 */
async function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  const actor = game.actors.get(speaker.actor) ?? game.actors.tokens[speaker.token];
  const item = actor ? actor.items.find(item => item.name === itemName) : null;
  if (!item)
    return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noItemNamed') + itemName);

  // Trigger the item roll
  switch (item.type) {
    case 'customAttack':
    case 'meleeweapon':
    case 'missileweapon':
    case 'firearm':
    case 'heavyweapon':
    case 'specialability-rollable':
      rollAttack(actor, item);
      break;

    case 'psionicpower':
    case 'miracle':
    case 'spell':
      rollPower(actor, item);
      break;

    default:
      // this will cause the item to be printed to the chat
      return item.toMessage();
  }
}

/**
 * Create a Macro from a skill, attribute, or interaction (?) drop.
 * Get an existing macro if one exists, otherwise create a new one.
 *
 * @param {string} skillName
 * @param {string} attributeName
 * @param {boolean} isInteractionAttack
 * @returns {Promise}
 */
async function rollSkillMacro(skillName, attributeName, isInteractionAttack, DNDescriptor) {
  if (DNDescriptor && !(
    typeof DNDescriptor === 'number' ||
    Number(DNDescriptor) != NaN ||
    Object.hasOwn(CONFIG.torgeternity.dnTypes, DNDescriptor))) {
    ui.notifications.error('The DN-Descriptor is wrong. Exiting the macro.');
    return;
  }

  let customSkill;
  const speaker = ChatMessage.getSpeaker();
  const actor = game.actors.get(speaker.actor) ?? game.actors.tokens[speaker.token];
  const isAttributeTest = skillName === attributeName;
  const isUnarmed = skillName === 'unarmedCombat';
  let skill = null;
  if (!isAttributeTest) {
    const skillNameKey = skillName; // .toLowerCase(); // skillName required to be internal value
    // would be nice to use display value as an input instead but we can't translate from i18n to internal values
    skill =
      actor && Object.keys(actor.system.skills).includes(skillNameKey)
        ? actor.system.skills[skillNameKey]
        : null;
    // Maybe a custom skill?
    if (!skill) {
      skill = actor.items.find(it => it.type === 'customSkill' && it.name === skillName)?.system;
      if (skill) customSkill = true;
    }
    if (!skill)
      return ui.notifications.warn(
        game.i18n.localize('torgeternity.notifications.noSkillNamed') + skillName
      );
  }

  const attributeNameKey = attributeName.toLowerCase();
  const attribute =
    actor && Object.keys(actor.system.attributes).includes(attributeNameKey)
      ? actor.system.attributes[attributeNameKey]
      : null;
  if (!attribute)
    return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noItemNamed'));
  if (isAttributeTest) {
    // dummy skill object since there's no actual skill in this case
    skill = {
      baseAttribute: attributeNameKey,
      adds: 0,
      value: attribute,
      isFav: actor.system.attributes[attributeNameKey + 'IsFav'],
      groupName: 'other',
      unskilledUse: true,
    };
  }

  // calculate the value using the attribute and skill adds, as the attribute might be different
  //    than the skill's current baseAttribute. This assumes the actor is a stormknight - different
  //    logic is needed for threats, who don't have adds.
  let skillValue = attribute.value;
  if (!isAttributeTest) {
    if (actor.type === 'stormknight') {
      skillValue += skill.adds;
    } else if (actor.type === 'threat') {
      const otherAttribute = actor.system.attributes[skill.baseAttribute];
      skillValue = Math.max(skill.value, otherAttribute.value);
    }
  }
  // Trigger the skill roll
  // The following is copied/pasted/adjusted from _onSkillRoll and _onInteractionAttack in TorgeternityActorSheet
  // This code needs to be centrally located!!!
  const test = {
    testType: isAttributeTest ? 'attribute' : 'skill',
    actor: actor,
    skillName: isAttributeTest ? attributeName : skillName,
    skillAdds: skill.adds,
    skillValue: skillValue,
    isFav: skill.isFav,
    DNDescriptor: DNDescriptor ?? 'standard',
    unskilledUse: skill.unskilledUse,
    woundModifier: parseInt(-actor.system.wounds.value),
    stymiedModifier: actor.statusModifiers.stymied,
    darknessModifier: 0, // parseInt(actor.system.darknessModifier),
    type: 'skill',
    bdDamageSum: 0,
    customSkill,
  };

  if (isUnarmed) {
    // see TorgeternityActorSheet.#onUnarmedAttack
    test.testType = 'attack';
    test.amountBD = 0;
    test.isAttack = true;
    test.unskilledUse = true;
    test.damage = actor.unarmed.damage;
    test.weaponAP = 0;
    test.applyArmor = true;
    test.applySize = true;
    test.attackOptions = true;
    test.bdDamageSum = 0;

    let dnDescriptor;
    if (game.user.targets.size && !DNDescriptor) {
      const firstTarget = game.user.targets.find(token => token.actor.type !== 'vehicle')?.actor ||
        game.user.targets.first().actor;

      if (firstTarget.type === 'vehicle') {
        dnDescriptor = 'targetVehicleDefense';
      } else {
        firstTarget.items
          .filter((it) => it.type === 'meleeweapon')
          .filter((it) => it.system.equipped).length !== 0
          ? (dnDescriptor = 'targetMeleeWeapons')
          : (dnDescriptor = 'targetUnarmedCombat');
      }
    }
    test.DNDescriptor = dnDescriptor ?? DNDescriptor;

  } else if (isInteractionAttack) {
    test.testType = 'interactionAttack';
    // Darkness seems like it would be hard to determine if it should apply to
    //    skill/attribute tests or not, maybe should be option in dialog?

    // Exit if no target or get target data
    let dnDescriptor;
    if (game.user.targets.size && !DNDescriptor) {
      switch (skillName) {
        case 'intimidation':
          dnDescriptor = 'targetIntimidation';
          break;
        case 'maneuver':
          dnDescriptor = 'targetManeuver';
          break;
        case 'taunt':
          dnDescriptor = 'targetTaunt';
          break;
        case 'trick':
          dnDescriptor = 'targetTrick';
          break;
        default:
          dnDescriptor = 'standard';
      }
    } else {
      dnDescriptor = 'standard';
    }
    test.DNDescriptor = dnDescriptor ?? DNDescriptor;
    test.unskilledUse = true;
  }

  return TestDialog.wait(test, { useTargets: true });
}

// change the generic threat token to match the cosm's one if it's set in the scene
Hooks.on('preCreateToken', async (document, data, options, userId) => {
  if (document.texture.src.includes('systems/torgeternity/images/characters/threat')) {
    const cosm = canvas.scene.cosm;
    // not cosmTypes, because that includes 'none'
    if (cosm && Object.hasOwn(CONFIG.torgeternity.cosmDecks, cosm))
      document.updateSource({ 'texture.src': 'systems/torgeternity/images/characters/threat-' + cosm + '.Token.webp' });
  }
});

Hooks.on('getActorContextOptions', async (actorDir, menuItems) => {

  menuItems.unshift({
    name: 'torgeternity.contextMenu.characterInfo.contextMenuTitle',
    icon: '<i class="fa-regular fa-circle-info"></i>',
    callback: async (li) => {
      const actor = actorDir.collection.get(li.dataset.entryId);

      let description = actor.system.details.background ?? actor.system.details.description ?? actor.system.description ?? '';
      description = `<div class="charInfoOutput">${description}</div>`;

      DialogV2.wait({
        classes: ['torgeternity', 'themed', 'theme-dark', 'charInfoOutput'],
        window: {
          title: game.i18n.format('torgeternity.contextMenu.characterInfo.windowTitle', { a: actor.name, }),
          contentClasses: ['scrollable'],
        },
        position: {
          width: 800
        },
        content: await foundry.applications.ux.TextEditor.enrichHTML(description),
        buttons: [
          {
            action: 'close',
            label: 'torgeternity.dialogWindow.buttons.ok',
            callback: () => { },
          },
          {
            action: 'showAllPlayers',
            label: 'torgeternity.dialogPrompts.showToPlayers',
            callback: (event, button, dialog) => {
              ChatMessage.create({
                content: dialog.element.querySelector('.charInfoOutput').outerHTML,
              });
            },
          },
        ]
      });
    },
  });
});


Hooks.on('renderJournalEntrySheet', (sheet, element, document, options) => {
  element.querySelector('article.journal-entry-page.text')?.classList.add('themed', 'theme-light');
})
Hooks.on('renderJournalEntryPageSheet', (sheet, element, document, options) => {
  element?.classList.add('themed', 'theme-light');
})

function showWelcomeMessage() {
  DialogV2.confirm({
    window: { title: 'Welcome to the Torg Eternity System for Foundry VTT!', },
    content: torgeternity.welcomeMessage,
    yes: {
      icon: 'fas fa-check',
      label: 'torgeternity.submit.OK',
    },
    no: {
      icon: 'fas fa-ban',
      label: 'torgeternity.submit.dontShow',
      callback: () => game.settings.set('torgeternity', 'welcomeMessage', false),
    },
    position: {
      top: 150,
      left: 100,
      width: 675,
    },
    actions: {
      openPack: (event, button) => {
        const packName = button.dataset.packName;
        if (packName) game.packs.get(packName).render({ force: true });
      }
    }
  });
}

Hooks.on('renderSceneControls', (sceneControls, html, context, options) => {
  //if (!options.isFirstRender) return;

  const parent = html.querySelector('button[data-control="torg"]');
  if (!parent || parent.hasChildNodes()) return;

  const image = document.createElement('img');
  image.classList.add('torgIcon');
  image.src = 'systems/torgeternity/images/te-logo.webp';
  parent.appendChild(image);
})



function TorgRadioBoxesNumber(name, choices, options) {
  const checked = options.hash.checked ?? null;
  const isNumber = typeof checked === 'number';
  const isChecked = checked !== null;
  const localize = options.hash.localize || false;
  let html = "";
  for (let [key, label] of Object.entries(choices)) {
    if (localize) label = game.i18n.localize(label);
    const element = document.createElement("label");
    element.classList.add("checkbox");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = key;
    if (isChecked) input.defaultChecked = (checked == key);
    if (isNumber) input.dataset.dtype = "Number";
    if (options.hash.tooltip) element.dataset.tooltip = key;
    element.append(input, " ", label);
    html += element.outerHTML;
  }
  return new Handlebars.SafeString(html);
}

function TorgHidden(value) {
  return value ? "hidden" : "";
}

function TorgDisconnected(doc) {
  return doc?.isDisconnected ? "disconnected" : "";
}

function TorgIsSvg(value) {
  return value.endsWith('.svg') ? 'svg' : '';
}