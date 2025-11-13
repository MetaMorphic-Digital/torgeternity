import torgeternityDeck from './torgeternityDeck.js';

/**
 *
 */
export async function setUpCardPiles() {
  const deckSetting = game.settings.get('torgeternity', 'deckSetting');
  const deckPack = game.packs.get(game.i18n.localize('torgeternity.packs.decks'));
  let deckFolder =
    game.folders.find((folder) => folder.flags?.torgeternity?.usage === 'coreCards') ||
    game.folders.getName(deckPack.title);
  if (!deckFolder || deckFolder.type !== 'Cards') {
    deckFolder = await Folder.create({
      name: deckPack.title,
      type: 'Cards',
      flags: { torgeternity: { usage: 'coreCards' } },
    });
  }
  /* list of deck keys for all the decks that will be in the pack - i.e. all keys of deckSettings aside from discard piles, active card, and storm knight hands*/
  const deckKeys = [
    'destinyDeck',
    'dramaDeck',
    ...Object.keys(CONFIG.torgeternity.cosmDecks)
  ];

  console.log(`Torg eternity system // setting up default card decks`);

  const deckIndex = await deckPack.getIndex({ fields: ['flags.torgeternity.usage'] });

  for (const deckKey of deckKeys) {
    if (deckKey === torgeternityDeck.UNUSED_DECK_ID) continue;
    if (!game.cards.get(deckSetting[deckKey])) {
      // if the deck defined by the current setting does not exist
      const deckId = deckIndex.find((deck) => deck.flags?.torgeternity?.usage === deckKey)._id; // find the ID of the deck with the appropriate flag
      const deck = await game.cards.importFromCompendium(deckPack, deckId, {
        folder: deckFolder.id,
      }); // import that deck
      deckSetting[deckKey] = deck.id; // add the deck name to the temporary settings object
    }
  }

  console.log(`Torg eternity system // setting up default discard piles and active card piles`);

  const discardKeys = ['cosmDiscard', 'dramaDiscard', 'destinyDiscard'];
  // set up discard piles
  for (const discardKey of discardKeys) {
    if (!game.cards.get(deckSetting[discardKey])) {
      const cardData = {
        name: game.i18n.localize('torgeternity.cardTypes.' + discardKey),
        type: 'pile',
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
        folder: deckFolder.id,
      };
      const discard = await Cards.create(cardData, { keepId: true, renderSheet: false });
      deckSetting[discardKey] = discard.id;
    }
  }

  // Add Active Drama
  if (!game.cards.get(deckSetting.dramaActive)) {
    const cardData = {
      name: game.i18n.localize('torgeternity.cardTypes.activeDrama'),
      type: 'pile',
      folder: deckFolder.id,
    };
    const activeDrama = await Cards.create(cardData, { keepId: true, renderSheet: false });
    deckSetting.dramaActive = activeDrama.id;
  }

  // Add journal entry with instructions relating to cards depending on language
  /* if(!game.journal.find(journal => journal.data.flags?.torgeternity?.usage === "manageCards")){//if the card management journal doesn't exist
        let journalId = journalIndex.find(journal => journal.flags?.torgeternity?.usage === "manageCards")._id
        await game.journal.importFromCompendium(basicRulesPack, journalId)
    }*/

  const stormknights = game.actors.filter((act) => act.type === 'stormknight');
  for (const sk of stormknights) {
    if (!sk.getDefaultHand()) {
      await sk.createDefaultHand();
    }
  }
  await game.settings.set('torgeternity', 'deckSetting', deckSetting);
  await game.settings.set('torgeternity', 'setUpCards', false);
}
