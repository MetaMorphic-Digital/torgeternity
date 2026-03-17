const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class HandsManager extends HandlebarsApplicationMixin(ApplicationV2) {

  selectedCards = new Set();

  static DEFAULT_OPTIONS = {
    id: 'hands-manager',
    tag: 'form',
    classes: ['torgeternity', 'hands-manager', 'themed', 'theme-dark'],
    window: {
      title: 'torgeternity.handsManager.title',
      contentClasses: ['standard-form'],
      resizable: true
    },
    position: {
      height: 700
    },
    buttons: [
      {
        action: 'offerTrade',
        icon: 'fa-solid fa-question fa-right-left',
        label: 'torgeternity.handsManager.button.offerTrade'
      },
      {
        action: 'exchange',
        icon: 'fa-solid fa-right-left',
        label: 'torgeternity.handsManager.button.exchange'
      },
      {
        action: 'resetSelection',
        label: 'Reset'
      },
    ],
    actions: {
      openHand: HandsManager.#onOpenHand,
      exchange: HandsManager.#onExchange,
      offerTrade: HandsManager.#onOfferTrade,
      toggleSelect: HandsManager.#onToggleSelect,
      resetSelection: HandsManager.#onResetSelection,
    }
  }

  static PARTS = {
    body: { template: 'systems/torgeternity/templates/cards/hands-manager.hbs', scrollable: [""] },
    footer: { template: 'templates/generic/form-footer.hbs' },
  }

  /** @inheritDoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    for (const hand of game.users.map(user => !user.isGM && user.character?.getDefaultHand()))
      if (hand) hand.apps[this.id] = this;

    const settings = game.settings.get('torgeternity', 'deckSetting');
    let deck = game.cards.get(settings?.destinyDiscard);
    if (deck) deck.apps[this.id] = this;
    deck = game.cards.get(settings?.cosmDiscard);
    if (deck) deck.apps[this.id] = this;
  }

  /** @inheritDoc */
  _onClose(options) {
    super._onClose(options);
    for (const hand of game.users.map(user => !user.isGM && user.character?.getDefaultHand()))
      if (hand) delete hand.apps[this.id];

    const settings = game.settings.get('torgeternity', 'deckSetting');
    let deck = game.cards.get(settings?.destinyDiscard);
    if (deck) delete deck.apps[this.id];
    deck = game.cards.get(settings?.cosmDiscard);
    if (deck) delete deck.apps[this.id];
  }

  async _onRender(context, options) {
    new foundry.applications.ux.DragDrop.implementation({
      dragSelector: "ol.cards > li",
      dropSelector: "ol.cards",
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        drop: this._onDrop.bind(this)
      }
    }).bind(this.element);

    return super._onRender(context, options);
  }

  async _preparePartContext(partId, context, options) {
    const partContext = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'body':
        partContext.hands = game.users.filter(user => !user.isGM && user.character).map(user => {
          return {
            user: user,
            character: user.character,
            hand: user.character.getDefaultHand()
          }
        });
        // What about COSM discard pile?
        const settings = game.settings.get('torgeternity', 'deckSetting');
        partContext.destinyDiscard = game.cards.get(settings?.destinyDiscard);
        partContext.cosmDiscard = game.cards.get(settings?.cosmDiscard);
        partContext.isGM = game.user.isGM;

        // If any selected card has been removed from a stack, 
        // then cancel the selection of all cards.
        if (this.selectedCards.size) {
          const found = [];
          for (const stack of [partContext.destinyDiscard, partContext.cosmDiscard, ...partContext.hands.map(hand => hand.hand)])
            for (const card of stack.cards)
              if (this.selectedCards.has(card.uuid))
                found.push(card.uuid);
          if (found.length !== this.selectedCards.size) {
            console.log('Some selected cards were removed from hands, cancelling all selections');
            this.selectedCards.clear();
          }
        }

        partContext.selectedCards = this.selectedCards;
        break;

      case 'footer':
        partContext.buttons = foundry.utils.duplicate(HandsManager.DEFAULT_OPTIONS.buttons);
        const needOffer = this.selectedCards.find(uuid => !fromUuidSync(uuid, { strict: false })?.isOwner);
        partContext.buttons[0].disabled = (this.selectedCards.size < 2 || !needOffer); // offerTrade
        partContext.buttons[1].disabled = (this.selectedCards.size < 2 || needOffer); // exchange
        break;
    }
    return partContext;
  }


  //
  // DRAG/DROP
  //

  async _onDragStart(event) {
    const li = event.currentTarget;
    const stack = game.cards.get(li.closest('ol.cards')?.dataset.handId);
    if (!stack.isOwner) return event.preventDefault();  // Abort the drag operation
    const card = stack.cards.get(li.dataset.cardId);
    if (card) event.dataTransfer.setData("text/plain", JSON.stringify(card.toDragData()));
  }


  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    if (data.type !== "Card") return;
    const card = await foundry.utils.getDocumentClass("Card").fromDropData(data);
    const stack = game.cards.get(event.currentTarget.closest('ol.cards')?.dataset.handId);
    if (card.parent === stack) return console.log('Ignore dropping card onto own stack');  // Don't drop onto self
    if (!card.parent.isOwner)
      return ui.notifications.info(`You cannot move a card from '${card.parent.name}' (not owner)`)
    if (!stack.isOwner)
      return ui.notifications.info(`You cannot move a card to '${stack.name}' (not owner)`)

    // Don't drop onto wrong discard pile
    if (stack.type === 'pile') {
      const settings = game.settings.get('torgeternity', 'deckSetting');
      if (settings[`${card.type}Discard`] !== stack.id)  // maybe destiny or cosm
        return;
    }

    //if (card.parent.id === stack.id) return this.#onSortCard(event, card);
    try {
      return await card.pass(stack);
    } catch (err) {
      console.error(`Failed to pass card to ${stack.name}`)
    }
  }

  //
  // ACTIONS
  //
  static async #onOpenHand(event, button) {
    game.cards.get(button.dataset.handId)?.sheet.render({ force: true })
  }

  /**
   * When we have ownership of both stacks, so we can do the exchange ourselves.
   * @param {*} event 
   * @param {*} button 
   * @returns 
   */
  static async #onExchange(event, button) {
    const cards = [];
    for (const element of this.element.querySelectorAll('li.selected')) {
      const stack = game.cards.get(element.closest('ol.cards')?.dataset.handId);
      cards.push({
        stack,
        card: stack.cards.get(element.dataset.cardId)
      })
    }

    // We own both stacks, so transfer immediately (only do second transfer if first transfer succeeded)
    cards[0].card.pass(cards[1].stack).then(prom => cards[1].card.pass(cards[0].stack));
    this.resetSelection()
  }

  static async #onOfferTrade(event, button) {
    const cards = [];
    for (const element of this.element.querySelectorAll('li.selected')) {
      const stack = game.cards.get(element.closest('ol.cards')?.dataset.handId);
      cards.push({
        userId: element.closest('div.playerHand')?.dataset.userId,
        actorId: element.closest('div.playerHand')?.dataset.actorId,
        stack,
        card: stack.cards.get(element.dataset.cardId)
      })
    }

    // Send the prompt to the other user.
    // If they reject the transfer, then cancel the selection.
    if (cards[0].card.isOwner) {
      if (!await this.promptCard(cards[1], cards[0])) return this.resetSelection();
    } else if (cards[1].card.isOwner) {
      if (!await this.promptCard(cards[0], cards[1])) return this.resetSelection();
    } else
      // We don't own either card, so we can't transfer them.
      return;

    // Pass to GM to actually perform the swap
    game.socket.emit(`system.${game.system.id}`, {
      request: 'swapCards',
      card1: cards[0].card.id,
      card2: cards[1].card.id,
      stack1: cards[0].stack.id,
      stack2: cards[1].stack.id,
    })
    this.resetSelection();
  }

  async promptCard(theirCard, myCard) {
    const from = game.i18n.format('torgeternity.handsManager.trade.from', { actor: game.actors.get(theirCard.actorId).name });

    // Prompt needs to be from THEIR point of view
    const response = await foundry.applications.api.DialogV2.query(theirCard.userId, 'confirm', {
      classes: ['exchange-card-dialog'],
      window: {
        title: 'torgeternity.handsManager.trade.title',
      },
      position: {
        left: 150,
        top: 150,
        width: 'auto'
      },
      content: `<h2>${from}</h2><table>
      <tr><td>${game.i18n.localize('torgeternity.handsManager.trade.yourCard')}</td>
      <td>${game.i18n.localize('torgeternity.handsManager.trade.theirCard')}</td></tr>
      <tr><td><h3>${theirCard.card.name}</h3></td>
      <td><h3>${myCard.card.name}</h3></td></tr>
      <tr><td><img src='${theirCard.card.faces[0].img}'></td>
      <td><img src='${myCard.card.faces[0].img}'></td></tr>
      </table>`
    });
    return (response === true);
  }

  static async #onToggleSelect(event, button) {

    // Check for deselection first
    const cardUuid = button.dataset.cardUuid;
    if (this.selectedCards.has(cardUuid)) {
      // Don't let a non-owned card be the sole-selected card
      if (!game.user.isGM && this.selectedCards.size === 2) {
        const otherCard = fromUuidSync(this.selectedCards.values().find(uuid => uuid !== cardUuid));
        if (!(otherCard?.parent.type === 'hand' && otherCard.isOwner))
          return;
      }
      this.selectedCards.delete(cardUuid);
      return this.render();
    }

    const list = button.closest('ol.cards');
    if (!list) return;
    const prevCard = list.querySelector('li.selected')?.dataset.cardUuid;
    if (prevCard) {
      // Picking a new card in the same list
      this.selectedCards.delete(prevCard);
      this.selectedCards.add(cardUuid);
      return this.render();
    }

    // First card must be from our own hand
    const hand = game.cards.get(list.dataset.handId);
    if (!game.user.isGM && this.selectedCards.size === 0) {
      if (hand.type !== 'hand' || !hand.isOwner) return;
    }
    if (hand.type === 'pile' && this.selectedCards.size === 1) {
      const card1 = fromUuidSync(this.selectedCards.first());
      const settings = game.settings.get('torgeternity', 'deckSetting');
      if (settings[`${card1.type}Discard`] !== list.dataset.handId)  // maybe destiny or cosm
        return;
    }

    // Two cards selected (in other lists) - don't allow this selection
    if (this.selectedCards.size < 2) {
      this.selectedCards.add(cardUuid);
      this.render();
    }
  }

  static async #onResetSelection(event, button) {
    this.resetSelection();
  }

  resetSelection() {
    this.selectedCards.clear();
    this.render();
  }

  toggleRender() {
    if (!this.rendered) return this.render({ force: true })
    if (this.minimized) return this.maximize();
    return this.close();
  }
}