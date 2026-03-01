'use strict';
import { initConfig } from './config.js';
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
import TorgCombatant from './dramaticScene/torgeternityCombatant.js';
import TorgCombatantGroup from './dramaticScene/torgeternityCombatantGroup.js';
import { registerDiceSoNice } from './modsupport/dice-so-nice.js';
import torgeternityPlayerHand from './cards/torgeternityPlayerHand.js';
import torgeternityPile from './cards/torgeternityPile.js';
import torgeternityDeck from './cards/torgeternityDeck.js';
import torgeternityCardConfig from './cards/torgeternityCardConfig.js';
import { torgeternityCardsDirectory } from './cards/torgeternityCardsDirectory.js';
import { torgeternityCard } from './cards/torgeternityCard.js';
import { torgeternityCards } from './cards/torgeternityCards.js';
import initTorgControlButtons from './controlButtons.js';
import createTorgShortcuts from './keybinding.js';
import GMScreen from './GMScreen.js';
import { setUpCardPiles } from './cards/setUpCardPiles.js';
import { TorgDie } from './torgdie.js';
import { activateStandartScene } from './activateStandartScene.js';
import { torgMigration } from './migrations.js';
import initTextEdidor from './initTextEditor.js';
import initProseMirrorEditor from './initProseMirrorEditor.js';
import { ChatMessageTorg } from './documents/chat/chatMessageTorg.js';
import * as actorDataModels from './data/actor/index.js';
import * as itemDataModels from './data/item/index.js';
import * as cardDataModels from './data/card/index.js';
import { TorgCombatantData } from './data/torgCombatantData.js';
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
import EffectsPanel from './effectsPanel.js';
import setupItemPiles from './modsupport/item-piles.js';
import setupTokenActionHud from './modsupport/token-action-hud.js';
import { initHandlebarsHelpers } from './hb-helpers.js';
import { initHotbarMacros } from './hotbar-macros.js';

const { DialogV2 } = foundry.applications.api;

Hooks.once('init', async function () {
  console.log('torgeternity | Initializing Torg Eternity System');

  initConfig();

  // -------global
  initHotbarMacros();
  initTextEdidor();
  initProseMirrorEditor();

  CONFIG.Item.documentClass = TorgeternityItem;
  CONFIG.Actor.documentClass = TorgeternityActor;
  CONFIG.ActiveEffect.documentClass = TorgActiveEffect;
  CONFIG.ActiveEffect.dataModels.base = TorgActiveEffectData;
  CONFIG.Actor.dataModels = actorDataModels.config;
  CONFIG.Item.dataModels = itemDataModels.config;
  CONFIG.Card.dataModels = cardDataModels.config;
  CONFIG.statusEffects = CONFIG.torgeternity.statusEffects;
  CONFIG.attributeTypes = CONFIG.torgeternity.attributeTypes;
  CONFIG.Token.rulerClass = TorgEternityTokenRuler;
  CONFIG.Token.objectClass = TorgEternityToken;
  CONFIG.Scene.documentClass = TorgeternityScene;
  CONFIG.Dice.terms.d = TorgDie;

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
  CONFIG.Combatant.dataModels.base = TorgCombatantData;
  CONFIG.CombatantGroup.documentClass = TorgCombatantGroup;
  CONFIG.ChatMessage.documentClass = ChatMessageTorg;

  // ----scenes
  // CONFIG.Scene.sheetClass = torgeternitySceneConfig;
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Scene, 'torgeternity', torgeternitySceneConfig, {
    label: 'Torg Eternity Scene Config',
    makeDefault: true,
  });
  CONFIG.ui.nav = torgeternityNav;
  CONFIG.ui.cards = torgeternityCardsDirectory;

  // ---custom user class
  // Player list disabled for now
  CONFIG.ui.players = TorgeternityPlayerList;
  CONFIG.ui.chat = TorgeternityChatLog;

  // ---cards
  CONFIG.Card.documentClass = torgeternityCard;
  CONFIG.Cards.documentClass = torgeternityCards;
  CONFIG.cardTypes = CONFIG.torgeternity.cardTypes;

  ui.macroHub = new MacroHub();
  ui.GMScreen = new GMScreen();
  ui.deckSettings = new DeckSettingMenu();

  // all settings after config
  registerTorgSettings();
  // ---register items and actors
  foundry.documents.collections.Items.registerSheet('torgeternity', TorgeternityItemSheet, {
    label: "Torg Eternity Item Sheet",
    makeDefault: true,
  });

  foundry.documents.collections.Actors.registerSheet('torgeternity', TorgeternityActorSheet, {
    label: "Torg Eternity Actor Sheet",
    makeDefault: true,
  });

  // ---register cards
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Cards, 'torgeternity', torgeternityPlayerHand, {
    label: 'Torg Eternity Player Hand',
    types: ['hand'],
    makeDefault: true,
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Cards, 'torgeternity', torgeternityPile, {
    label: 'Torg Eternity Pile',
    types: ['pile'],
    makeDefault: true,
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Cards, 'torgeternity', torgeternityDeck, {
    label: 'Torg Eternity Deck',
    types: ['deck'],
    makeDefault: true,
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Card, 'torgeternity', torgeternityCardConfig, {
    label: 'Torg Eternity Card Configuration',
    types: ['destiny', 'drama', 'cosm'],
    makeDefault: true,
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(ActiveEffect, 'torgeternity', TorgActiveEffectConfig, {
    label: 'Torg Active Effect Configuration',
    makeDefault: true,
  });

  // ----------preloading handlebars templates
  preloadTemplates();
  // adding special torg buttons
  initTorgControlButtons();
  // create torg shortcuts
  createTorgShortcuts();

  // Foundry#initializePacks is called just before the 'setup' hook
  // But needs to be after 'ready' to set properties on compendiums.
  initHideCompendium();

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
});

Hooks.once('setup', async function () {

  // Choose the best document type for creation (minimise clicks)
  CONFIG.Actor.defaultType = (game.user.isGM) ? 'threat' : 'stormknight';

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

  initHandlebarsHelpers();

  // Ensure all Actor & Item packs have the updated index contents
  for (const pack of game.packs) {
    if (pack.metadata.type === 'Actor' || pack.metadata.type === 'Item')
      await pack.getIndex();
  }

  if (game.settings.get('torgeternity', 'showEffectsPanel'))
    new EffectsPanel();
});

// -------------once everything ready
Hooks.on('ready', async function () {

  // migration script
  if (game.user.isGM) torgMigration();

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
  if (CONFIG.torgeternity.supportedLanguages.indexOf(lang) === -1) lang = 'en';

  CONFIG.torgeternity.welcomeMessage = await foundry.applications.handlebars.renderTemplate(
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
              window.open('https://github.com/MetaMorphic-Digital/torgeternity/issues/new', '_blank');
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

/*
 * Enforce Light theme for journals
 */
Hooks.on('renderJournalEntrySheet', (sheet, element, document, options) => {
  element?.classList.add('themed', 'theme-light');
})
// and for page editor app
Hooks.on('renderJournalEntryPageSheet', (sheet, element, document, options) => {
  element?.classList.add('themed', 'theme-light');
})

function showWelcomeMessage() {
  DialogV2.confirm({
    window: { title: 'Welcome to the Torg Eternity System for Foundry VTT!', },
    content: CONFIG.torgeternity.welcomeMessage,
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

/*
 * External Module Support
 */
Hooks.once("item-piles-ready", setupItemPiles);

Hooks.once('tokenActionHudCoreApiReady', setupTokenActionHud);

Hooks.once('diceSoNiceReady', dice3d => registerDiceSoNice(dice3d));