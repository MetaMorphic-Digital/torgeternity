const { DialogV2 } = foundry.applications.api;

/**
 *
 */
export default class torgeternityPile extends foundry.applications.sheets.CardPileConfig { // type = "pile"

  static DEFAULT_OPTIONS = {
    type: "pile",
    classes: ['torgeternity', 'themed', 'theme-dark'],
    position: {
      width: 400,
      height: "auto"
    },
    actions: {
      return: torgeternityPile.#onReturn,
    }
  }

  static PARTS = {
    cards: {
      template: 'systems/torgeternity/templates/cards/torgeternityPile.hbs',
      root: true,
      scrollable: ["ol.cards"]
    },
    footer: { template: "templates/generic/form-footer.hbs" }
  }

  /**
   *
   * @inheritdoc
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.cards = this._prepareCards(); // Get in sorted order
    for (const card of context.cards) {
      card.typeLoc = game.i18n.localize(`torgeternity.cardTypes.${card.type}`);
    }
    return context;
  }

  _prepareButtons() {
    if (!this.document.isOwner) return [];

    return [
      { type: 'button', icon: 'fas fa-random', label: 'CARDS.ACTIONS.Shuffle', action: "shuffle" },
      { type: 'button', icon: 'fas fa-share-square', label: 'CARDS.ACTIONS.Pass', action: "pass" },
      { type: 'button', icon: 'fas fa-recycle', label: 'torgeternity.sheetLabels.return', action: "return", tooltip: 'torgeternity.dialogPrompts.return' },
    ]
  }

  /**
   * 
   * @param {Event} event 
   * @this {torgeternityPile}
   */
  static async #onReturn(event) {
    for (let i = 0; i < this.document.cards.size; i++) {
      this.document.cards.contents[i].recall();
    }
  }
}
