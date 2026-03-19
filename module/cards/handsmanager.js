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
      clickCard: HandsManager.#onClickCard,
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
      dragSelector: "div.cardList:not(.offline) ol.cards > li",
      dropSelector: "div.cardList:not(.offline) div.list",
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        drop: this._onDrop.bind(this)
      }
    }).bind(this.element);

    this.element.addEventListener('dragover', this._onDragOver.bind(this), { capture: true })
    this.element.addEventListener('dragend', this._onDragEnd.bind(this), { capture: true })
    return super._onRender(context, options);
  }

  async _preparePartContext(partId, context, options) {
    const partContext = await super._preparePartContext(partId, context, options);

    switch (partId) {
      case 'body':
        partContext.hands = game.users.filter(user => !user.isGM && user.character).map(user => {
          const hand = user.character.getDefaultHand();
          return {
            user: user,
            hand,
            cards: hand.cards.contents.toSorted(sortPooled),
          }
        });
        const settings = game.settings.get('torgeternity', 'deckSetting');
        partContext.destinyDiscard = { stack: game.cards.get(settings?.destinyDiscard) };
        partContext.destinyDiscard.cards = partContext.destinyDiscard.stack?.cards.contents.toSorted(sortDiscard);
        partContext.cosmDiscard = { stack: game.cards.get(settings?.cosmDiscard) };
        partContext.cosmDiscard.cards = partContext.cosmDiscard.stack?.cards.contents.toSorted(sortDiscard);
        partContext.isGM = game.user.isGM;

        // If any selected card has been removed from a stack, 
        // then cancel the selection of all cards.
        if (this.selectedCards.size) {
          const found = this.selectedCards.filter(uuid => fromUuidSync(uuid, { strict: false }));
          if (found.size !== this.selectedCards.size) {
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
    const stack = game.cards.get(li.closest('ol.cards')?.dataset.stackId);
    if (!stack.isOwner) return event.preventDefault();  // Abort the drag operation
    this.dragcard = stack.cards.get(li.dataset.cardId);
    if (this.dragcard) event.dataTransfer.setData("text/plain", JSON.stringify(this.dragcard.toDragData()));
  }

  /**
   * Prevent dragging a card to an invalid list
   * @param {*} event 
   * @returns 
   */
  _onDragOver(event) {
    // event.dataTransfer isn't available/reliable on dragover event, so we store the card separately
    event.stopPropagation();
    if (!this.dragcard) return;
    const stack = game.cards.get(event.srcElement.closest('div.cardList:not(.offline) div.list')?.dataset.stackId);
    if (!stack) return;
    if (stack.type === 'pile') {
      const settings = game.settings.get('torgeternity', 'deckSetting');
      if (settings[`${this.dragcard.type}Discard`] !== stack.id)  // maybe destiny or cosm
        return;
    } else if (this.dragcard.parent === stack)
      return;

    // Indicate that the drop is allowed.
    event.preventDefault();
  }

  /**
   * Cancel currently dragged card when a drag ends.
   * @param {*} event 
   */
  async _onDragEnd(event) {
    this.dragcard = null;
  }

  /**
   * Only allow drop of a card from this window.
   * @param {*} event 
   * @returns 
   */
  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    if (data.type !== "Card") return;
    const card = await foundry.utils.getDocumentClass("Card").fromDropData(data);
    const stack = game.cards.get(event.currentTarget.dataset.stackId);
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
      if (card.system.pooled) await card.update({ 'system.pooled': false });
    }

    //if (card.parent.id === stack.id) return this.#onSortCard(event, card);
    try {
      return card.pass(stack, game.torgeternity.cardChatOptions).then(() => {
        if (stack.type === 'pile') {
          card.toMessage({
            content: `<div class="card-draw flexrow"><span class="card-chat-tooltip">
            <img class="card-face" src="${card.img}"/><span><img src="${card.img}"></span></span>
            <span class="card-name">${game.i18n.localize('torgeternity.chatText.discardsCard')} ${card.name}</span>
            </div>`,
          });
        } else {
          card.toMessage({
            content: `<div class="card-draw flexrow"><span class="card-chat-tooltip"><img class="card-face" 
            src="${card.img}"/><span><img src="${card.img}"></span></span><h4 class="card-name">
              ${game.i18n.localize('torgeternity.chatText.passesCard1')} 
              ${card.name} ${game.i18n.localize('torgeternity.chatText.passesCard2')}
               ${stack.name}.</h4></div>`,
          });
        }
      })
    } catch (err) {
      console.error(`Failed to pass card to ${stack.name}`)
    }
  }

  //
  // ACTIONS
  //
  static async #onOpenHand(event, button) {
    game.cards.get(button.dataset.stackId)?.sheet.render({ force: true })
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
      const stack = game.cards.get(element.closest('ol.cards')?.dataset.stackId);
      cards.push({
        stack,
        card: stack.cards.get(element.dataset.cardId)
      })
    }

    await this.swapCards(cards[0].card, cards[1].card, cards[0].stack, cards[1].stack);
    this.resetSelection()
  }

  static async #onOfferTrade(event, button) {
    const cards = [];
    for (const element of this.element.querySelectorAll('li.selected')) {
      const stack = game.cards.get(element.closest('ol.cards')?.dataset.stackId);
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

  /**
   * Receive message on the socket as a GM
   * @param {*} data 
   * @returns 
   */
  async gmExchangeCards(data) {
    console.log('GM: swapCards');
    const stack1 = game.cards.get(data.stack1);
    const stack2 = game.cards.get(data.stack2);
    if (!stack1 || !stack2) return console.warn('Failed to find both card stacks');
    return this.swapCards(stack1.cards.get(data.card1), stack2.cards.get(data.card2), stack1, stack2);
  }

  /**
   * Move card1 to stack2, and move card2 to stack1.
   * If moving to a 'pile', ensure that "pooled" flag is removed.
   * @param {*} card1 
   * @param {*} card2 
   * @param {*} stack1 
   * @param {*} stack2 
   */
  async swapCards(card1, card2, stack1, stack2) {
    if (!card1 || !card2) return;
    if (card1.system.pooled && stack2.type === 'pile') await card1.update({ 'system.pooled': false })
    if (card2.system.pooled && stack1.type === 'pile') await card2.update({ 'system.pooled': false })
    // Only do second transfer if first one succeeded
    return card1.pass(stack2, game.torgeternity.cardChatOptions)
      .then(() => card2.pass(stack1, game.torgeternity.cardChatOptions))
      .then(async () => {
        await card1.toMessage({
          content: `<div class="card-draw flexrow"><span class="card-chat-tooltip"><img class="card-face" 
            src="${card1.img}"/><span><img src="${card1.img}"></span></span><h4 class="card-name">
              ${game.i18n.localize('torgeternity.chatText.passesCard1')} 
              ${card1.name} ${game.i18n.localize('torgeternity.chatText.passesCard2')}
               ${stack2.name}.</h4></div>`,
        });
        await card2.toMessage({
          content: `<div class="card-draw flexrow"><span class="card-chat-tooltip"><img class="card-face" 
            src="${card2.img}"/><span><img src="${card2.img}"></span></span><h4 class="card-name">
              ${game.i18n.localize('torgeternity.chatText.passesCard1')} 
              ${card2.name} ${game.i18n.localize('torgeternity.chatText.passesCard2')}
               ${stack1.name}.</h4></div>`,
        });
      })
  }

  static async #onClickCard(event, button) {
    // Check that the stack isn't disabled
    if (!game.user.isGM && event.target.closest('div.cardList')?.classList.contains('offline')) return;

    const cardUuid = button.dataset.cardUuid;

    // Special check for POOLing during combat.
    if (event.shiftKey) {
      // No effect if no combat is in progress
      if (!game.combat?.started) return;
      // Check that the click is in the player's own hand.
      const stack = game.cards.get(button.closest('ol.cards')?.dataset.stackId);
      if (stack.type !== 'hand' || (!game.user.isGM && game.user.character?.getDefaultHand() !== stack))
        return;
      const card = fromUuidSync(cardUuid);
      if (card) card.update({ 'system.pooled': !card.system.pooled });
      return;
    }

    // Check for deselection first
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
    const stack = game.cards.get(list.dataset.stackId);

    // During combat, can only select cards in other hands if they are in the pool.
    if (!game.user.isGM && game.combat?.started && stack.type === 'hand' && !fromUuidSync(cardUuid)?.system.pooled)
      return;

    const prevCard = list.querySelector('li.selected')?.dataset.cardUuid;
    if (prevCard) {
      // Picking a new card in the same list
      this.selectedCards.delete(prevCard);
      this.selectedCards.add(cardUuid);
      return this.render();
    }

    // First card must be from our own hand
    if (!game.user.isGM && this.selectedCards.size === 0) {
      if (stack.type !== 'hand' || !stack.isOwner) return;
    }
    if (stack.type === 'pile' && this.selectedCards.size === 1) {
      const card1 = fromUuidSync(this.selectedCards.first());
      const settings = game.settings.get('torgeternity', 'deckSetting');
      if (settings[`${card1.type}Discard`] !== list.dataset.stackId)  // maybe destiny or cosm
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

  userConnected(user, connected) {
    if (!this.rendered) return;
    if (!connected) {
      // On disconnection, clear the selection if one of the user's cards was selected.
      const hand = user.character?.getDefaultHand();
      if (hand && this.selectedCards.find(uuid => fromUuidSync(uuid, { strict: false })?.parent === hand)) {
        console.log('Some selected cards were removed from hands, cancelling all selections');
        this.selectedCards.clear();
      }
    }
    this.render();
  }
}

// Pooled cards appear before non-pooled cards
function sortPooled(a, b) {
  if (a.system.pooled != b.system.pooled) return a.system.pooled ? -1 : 1;
  return ((a.sort ?? -Infinity) - (b.sort ?? -Infinity)) || 0;
}

// Discard needs to have the most recently discarded card first
function sortDiscard(a, b) {
  return ((b.sort ?? -Infinity) - (a.sort ?? -Infinity)) || 0;
}

Hooks.on('userConnected', (user, connected) => ui.handsViewer?.userConnected(user, connected))
// combatStart hook only triggered on GM position that presses the start combat button,
// so have to detect start of first round of combat
Hooks.on('combatTurnChange', (combat, previous, current) => {
  if (previous.round === 0 && current.round === 1) ui.handsViewer?.resetSelection()
})