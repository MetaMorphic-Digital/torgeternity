const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class HandsManager extends HandlebarsApplicationMixin(ApplicationV2) {
  static app;

  static DEFAULT_OPTIONS = {
    id: 'hands-manager',
    tag: 'form',
    classes: ['torgeternity', 'hands-manager', 'themed', 'theme-dark'],
    window: {
      title: 'torgeternity.handsManager.title',
      contentClasses: ['standard-form'],
      resizable: true
    },
    buttons: [
      {
        action: 'exchange',
        icon: 'right-left',
        label: 'torgeternity.handsManager.button.exchange'
      },
      {
        action: 'close',
        label: 'Close'
      },
    ],
    actions: {
      openHand: HandsManager.#onOpenHand,
      exchange: HandsManager.#onExchange,
      toggleSelect: HandsManager.#onToggleSelect,
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
  }

  /** @inheritDoc */
  _onClose(options) {
    super._onClose(options);
    for (const hand of game.users.map(user => !user.isGM && user.character?.getDefaultHand()))
      if (hand) delete hand.apps[this.id];
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
        break;

      case 'footer':
        partContext.buttons = HandsManager.DEFAULT_OPTIONS.buttons;
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

  static async #onExchange(event, button) {
    const elements = this.element.querySelectorAll('li.selected');
    const cards = [];
    for (const element of elements) {
      const stack = game.cards.get(element.closest('ol.cards')?.dataset.handId);
      cards.push({
        userId: element.closest('div.playerHand')?.dataset.userId,
        actorId: element.closest('div.playerHand')?.dataset.actorId,
        stack,
        card: stack.cards.get(element.dataset.cardId)
      })
    }
    if (cards.length !== 2) return ui.notifications.info('Must select exactly 2 cards to Swap');

    if (cards[0].stack.isOwner && cards[1].stack.isOwner) {
      // We own both stacks, so transfer immediately (only do second transfer if first transfer succeeded)
      return cards[0].card.pass(cards[1].stack).then(completed => cards[1].card.pass(cards[0].stack))
    }

    // Not owner of at least one stack.
    if (game.user.id === cards[0].userId) {
      if (!await this.promptCard(cards[1], cards[0])) return;
    } else if (game.user.id === cards[1].userId) {
      if (!await this.promptCard(cards[0], cards[1])) return;
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
    const list = button.closest('ol.cards');
    if (!list) return;

    const stack = game.cards.get(list.dataset.handId);
    const card = stack.cards.get(button.dataset.cardId);

    for (const elem of list.querySelectorAll('li'))
      if (elem === button)
        elem.classList.add('selected');
      else
        elem.classList.remove('selected');
  }

  static toggleRender() {
    if (!this.app) this.app = new HandsManager();
    if (this.app.rendered)
      this.app.close();
    else
      this.app.render({ force: true })
  }
}