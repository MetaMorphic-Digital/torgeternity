export class torgeternityCardsDirectory extends foundry.applications.sidebar.tabs.CardsDirectory {

  static _entryPartial = "systems/torgeternity/templates/sidebar/cardsDirectory-partial.hbs";

  async _prepareDirectoryContext(context, options) {
    await super._prepareDirectoryContext(context, options);
    context.usedDecks = {};
    context.playerDecks = {};
    for (const [label, id] of Object.entries(game.settings.get('torgeternity', 'deckSetting')))
      context.usedDecks[id] = game.i18n.localize(CONFIG.torgeternity.cosmTypes[label] ?? `torgeternity.cardTypes.${label}`);
    for (const id of game.actors.filter(act => act.type === 'stormknight').map(act => act.getDefaultHand()?.id))
      context.playerDecks[id] = game.i18n.localize('Player Hand');
  }
}