/**
 *
 */
export default class torgeternityDeck extends foundry.applications.sheets.CardDeckConfig {

  static UNUSED_DECK_ID = '-unused-';

  static DEFAULT_OPTIONS = {
    type: "deck",
    classes: ['torgeternity', 'themed', 'theme-dark'],
    position: {
      width: 600,
      height: "auto"
    },
  }

  static PARTS = {
    header: { template: "templates/cards/deck/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    details: { template: "systems/torgeternity/templates/cards/torgeternityDeck-details.hbs" },
    cards: { template: "systems/torgeternity/templates/cards/torgeternityDeck-cards.hbs", scrollable: ["ol.cards"] },
    footer: { template: "templates/generic/form-footer.hbs" }
  }

  /**
   *
   * @inheritdoc
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.cards = this._prepareCards();
    for (const card of context.cards) {
      card.typeLoc = _loc(`torgeternity.cardTypes.${card.type}`);
    }
    return context;
  }

  _prepareButtons() {
    if (!this.document.isOwner) return [];

    return [
      { type: 'button', icon: 'fas fa-random', label: 'CARDS.ACTIONS.Shuffle', cssClass: "card-control", action: "shuffle" },
      { type: 'button', icon: 'fas fa-share-square', label: 'CARDS.ACTIONS.Deal', cssClass: "card-control", action: "deal" },
      { type: 'button', icon: 'fas fa-undo', label: 'CARDS.ACTIONS.Reset', cssClass: "card-control", action: "reset" },
      { type: 'submit', icon: 'fas fa-save', label: 'CARDS.ACTIONS.Save', cssClass: "card-control" },
    ]
  }
}
