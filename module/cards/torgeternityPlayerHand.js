import torgeternityDeck from './torgeternityDeck.js';

const { DialogV2 } = foundry.applications.api;

/**
 *
 */
export default class torgeternityPlayerHand extends foundry.applications.sheets.CardHandConfig { // type="hand"

  static DEFAULT_OPTIONS = {
    type: "hand",
    classes: ['torgeternity', 'themed', 'theme-dark'],
    window: {
      resizable: false
    },
    position: {
      width: 800
    },
    actions: {
      controlCard: torgeternityPlayerHand.#onControlCard,
      openDeck: torgeternityPlayerHand.#onOpenDeck,
      focusCard: torgeternityPlayerHand.#onFocusCard,
      drawCosm: torgeternityPlayerHand.#onDrawCosm,
      drawDestiny: torgeternityPlayerHand.#onDrawDestiny,
      lifelike: torgeternityPlayerHand.#onLifelike
    }
  }

  static PARTS = {
    normal: { template: 'systems/torgeternity/templates/cards/torgeternityPlayerHand.hbs', scrollable: ["ol[data-cards]"] },
    lifelike: { template: "systems/torgeternity/templates/cards/torgeternityPlayerHand_lifelike.hbs" },
  }

  /**
   *
   * @inheritdoc
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.disablePlay = context?.document.getFlag('torgeternity', 'disablePlayCards');
    for (const card of context?.document.cards) {
      card.typeLoc = game.i18n.localize(`torgeternity.cardTypes.${card.type}`);
    }
    context.buttons = this._prepareButtons();
    return context;
  }

  _configureRenderParts(options) {
    const part = this.document.flags.torgeternity.lifelike ? 'lifelike' : 'normal';
    let parts = {};
    parts[part] = foundry.utils.deepClone(this.constructor.PARTS[part]);
    parts[part].root = true;
    return parts;
  }

  async _preparePartContext(partId, context, options) {
    let tempPartId = partId;
    // Ensure configuration for 'cards' is put into the context ( fields: cards, cardTypes, sortModeIcon })
    if (partId === 'normal' || partId === 'lifelike') tempPartId = 'cards';
    return super._preparePartContext(tempPartId, context, options);
  }

  _prepareButtons() {
    return [
      { type: 'button', icon: 'fas fa-plus', label: 'torgeternity.dialogPrompts.drawDestiny', cssClass: "card-control", action: "drawDestiny" },
      { type: 'button', icon: 'fas fa-plus', label: 'torgeternity.dialogPrompts.drawCosm', cssClass: "card-control", action: "drawCosm" },
    ]
  }

  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    const header = frame.querySelector('header.window-header');
    const control = header.querySelector('button.header-control');

    const newNode = document.createElement("span");
    newNode.classList.add('handdesign');
    newNode.innerHTML = game.i18n.localize('torgeternity.dialogPrompts.lifelike');
    const input = foundry.applications.fields.createCheckboxInput({
      name: 'flags.torgeternity.lifelike',
      value: this.document.flags.torgeternity.lifelike,
      classes: 'toggle',
      id: 'lifelike',
      dataset: { action: 'lifelike' },
    })
    newNode.appendChild(input);
    header.insertBefore(newNode, control);
    return frame;
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (options.isFirstRender) {
      // Don't set position if the window is already open
      if (game.settings.get('torgeternity', 'playerHandBottom')) {
        options.position.top = parseInt(canvas.screenDimensions[1]) - 350;
        options.position.left = parseInt(canvas.screenDimensions[0]) - 1250;
      } else {
        options.position.top = 150;
        //options.position.left = "auto";
      }
    }
  }
  /**
   *
   * @param html
   */
  async _onRender(context, options) {
    if (this.document.getFlag('torgeternity', 'lifelike')) {
      this.rotateCards(this.element);
    }
    // The following is required to get drag/drop working
    if (options.parts.includes('normal') || options.parts.includes('lifelike'))
      options.parts.push('cards');

    // An extra drag-drop for Lifelike
    new foundry.applications.ux.DragDrop.implementation({
      //dragSelector: "div#handedCards",
      dropSelector: "div#handedCards",
      permissions: {
        dragstart: () => this.isEditable,
        drop: () => this.isEditable
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this)
      }
    }).bind(this.element);

    await super._onRender(context, options);
  }

  /**
   * Our own drag/drop handler copes with dropping into the blank area of the lifelike hand,
   * but we must prevent the drop handler being called twice when a card is dropped onto one
   * the two piles of cards in that window.
   * @param {Event} event 
   */
  _onDrop(event) {
    super._onDrop(event);
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  /**
   *
   * @param event
   * @this {torgeternityPlayerHand}
   */
  static async #onControlCard(_event, button) {
    const li = button.closest("li[data-card-id]");
    const stack = this.document;
    const card = stack.cards.get(li?.dataset.cardId);

    // Save any pending change to the form
    await this.submit({ operation: { render: false } });

    // Handle the control action
    switch (button.dataset.control) {
      case 'pass':
        await this.playerPassDialog(card);
        break;
      case 'create':
        getDocumentClass('Card').createDialog({}, { parent: this.object, pack: this.document.pack });
        break;
      case 'edit':
        card.sheet.render({ force: true });
        break;
      case 'delete':
        card.deleteDialog();
        break;
      case 'deal':
        this.document.dealDialog();
        break;
      case 'draw':
        this.document.drawDialog();
        break;
      case 'pass':
        this.document.passDialog();
        break;
      case 'reset':
        this._prepareCards('standard');
        this.document.recall();
        break
      case 'nextFace':
        card.update({ face: card.face === null ? 0 : card.face + 1 });
        break
      case 'prevFace':
        card.update({ face: card.face === 0 ? null : card.face - 1 });
        break
      case 'display':
        const image1 = new foundry.applications.apps.ImagePopout({ src: card.img, window: { title: card.name } });
        image1.render({ force: true }, { width: 425, height: 650 });
        image1.shareImage();
        break;
      case 'view':
        const image2 = new foundry.applications.apps.ImagePopout({ src: card.img, window: { title: card.name } });
        image2.render({ force: true }, { width: 425, height: 650 });
        break;
      case 'discard':
        {
          if (_event.shiftKey) {
            card.recall();
            break;
          }
          await card.update({ "system.pooled": false });
          const settings = game.settings.get('torgeternity', 'deckSetting');
          const discardPile = game.cards.get((card.type === 'destiny') ? settings.destinyDiscard : settings.cosmDiscard);
          if (!discardPile) break;
          await card.pass(discardPile, game.torgeternity.cardChatOptions);
          card.toMessage({
            content: `<div class="card-draw flexrow"><span class="card-chat-tooltip">
            <img class="card-face" src="${card.img}"/><span><img src="${card.img}"></span></span>
            <span class="card-name">${game.i18n.localize('torgeternity.chatText.discardsCard')} ${card.name}</span>
            </div>`,
          });
          break;
        }
      case 'play':
        {
          await card.update({ "system.pooled": false });
          const settings = game.settings.get('torgeternity', 'deckSetting');
          const discardPile = game.cards.get((card.type === 'destiny') ? settings.destinyDiscard : settings.cosmDiscard);
          if (!discardPile) break;
          await card.pass(discardPile, game.torgeternity.cardChatOptions);
          card.toMessage({
            content: `<div class="card-draw flexrow"><span class="card-chat-tooltip">
            <img class="card-face" src="${card.img}"/><span><img src="${card.img}"></span></span>
            <span class="card-name">${game.i18n.localize('torgeternity.chatText.playsCard')} ${card.name}</span>
            </div>`,
          });
          break;
        }
    }
  }

  /**
   * @this {torgeternityPlayerHand}
   */
  static #onDrawCosm() {
    this.drawCosmDialog();
  }

  /**
   * @this {torgeternityPlayerHand}
   */
  static #onDrawDestiny() {
    return this.document.drawDestiny();
  }

  /**
   * 
   * @param {Event} event 
   * @param {HTMLButtonElement} button 
   * @this {torgeternityPlayerHand}
   */
  static #onOpenDeck(event, button) {
    const card = this.document.cards.get(button.closest("li[data-card-id]")?.dataset.cardId);
    console.log('open deck for', card)
    card?.source.sheet.render({ force: true })
  }
  /**
 *
 * @param event
 * @this {torgeternityPlayerHand}
 */
  static async #onLifelike(event, button) {
    await this.document.setFlag('torgeternity', 'lifelike', button.checked);
    return this.render({ force: true });
  }
  /**
   *
   * @param event
   */
  async _onChangeForm(formConfig, event) {
    const input = event.target;
    const li = input.closest('.card');
    const card = li ? this.document.cards.get(li.dataset.cardId) : null;

    // Save any pending change
    await this.submit({ operation: { render: false } });

    // Handle the control action
    switch (input.dataset.action) {
      case 'poolToggle':
        await card.update({ "system.pooled": !card.system.pooled });
        return;
    }
  }

  /**
   *
   * @param card
   */
  async playerPassDialog(card) {
    // only hands of connected characters will be shown
    let cards;
    if (game.user.isGM) {
      cards = game.cards.filter(cards => cards !== this && cards.type === 'hand');
    } else {
      cards = game.users
        .filter(user => user.active && !user.isGM && !user.isSelf)
        .map(user => user.character.getDefaultHand())
        .filter(cards => cards.type === 'hand' && cards.testUserPermission(game.user, 'LIMITED'));
    }
    if (!cards.length)
      return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noHands'));

    // Construct the dialog HTML
    const html = await foundry.applications.handlebars.renderTemplate('systems/torgeternity/templates/cards/playerPassDialog.hbs',
      { cards: cards });

    // Display the prompt
    return DialogV2.prompt({
      classes: ['torgeternity', 'themed', 'theme-dark'],
      window: { title: 'torgeternity.dialogPrompts.playerPassTitle' },
      content: html,
      ok: {
        label: game.i18n.localize('torgeternity.dialogPrompts.playerPassLabel'),
        callback: async (event, button, dialog) => {
          const form = dialog.element.querySelector('form');
          const fd = new foundry.applications.ux.FormDataExtended(form).object;
          const to = game.cards.get(fd.to);
          const toName = to.name;
          card.toMessage({
            content: `<div class="card-draw flexrow"><span class="card-chat-tooltip"><img class="card-face" 
            src="${card.img}"/><span><img src="${card.img}"></span></span><h4 class="card-name">
              ${game.i18n.localize('torgeternity.chatText.passesCard1')} 
              ${card.name} ${game.i18n.localize('torgeternity.chatText.passesCard2')}
               ${toName}.</h4></div>`,
          });
          return card.pass(to, game.torgeternity.cardChatOptions, game.torgeternity.cardChatOptions).catch((err) => {
            ui.notifications.error(err.message);
            return this;
          });
        },
      },
    });
  }

  /**
   *
   */
  async drawCosmDialog() {
    const data = { decks: {} };
    const decks = foundry.utils.duplicate(game.settings.get('torgeternity', 'deckSetting'));
    for (const key in decks) {
      if (CONFIG.torgeternity.cosmDecks[key] && decks[key] !== torgeternityDeck.UNUSED_DECK_ID) {
        data.decks[decks[key]] = `torgeternity.cosmDecks.${key}`;
      }
    }
    const html = await foundry.applications.handlebars.renderTemplate(
      'systems/torgeternity/templates/cards/drawCosmDialog.hbs',
      data
    );

    return DialogV2.prompt({
      classes: ['torgeternity', 'themed', 'theme-dark'],
      window: { title: 'torgeternity.dialogPrompts.cosmDialogTitle' },
      content: html,
      ok: {
        label: game.i18n.localize('torgeternity.dialogPrompts.cosmDeckDialogLabel'),
        callback: (event, button, dialog) => {
          const form = dialog.element.querySelector('form');
          const fd = new foundry.applications.ux.FormDataExtended(form).object;
          this.document.drawCosm(fd.from);
        },
      },
    });
  }
  /**
   *
   * @param html
   */
  rotateCards(html) {
    const cardsAreas = html.querySelectorAll('.cards');
    for (const area of cardsAreas) {
      for (let i = 0; i < area.children.length; i++) {
        const card = area.children[i];
        card.style.transform = `rotateZ(${i * 4}deg) translateX(${i * 30}px)`;
      }
      area.style.transform = `rotateZ(${-((area.children.length - 1) * 2)}deg) translateX(-${area.children.length * 15
        }px)`;
    }
  }
  /**
   *
   * @param ev
   * @this {torgeternityPlayerHand}
   */
  static #onFocusCard(ev) {
    const card = ev.target.closest('li.card');
    card.classList.toggle('focusedCard');
    if (card.classList.contains('focusedCard')) {
      card.setAttribute('data-rot', card.style.transform);
      const correction =
        parseInt(card.parentElement.style.transform.replace('rotateZ(', '').replace(')deg', '')) *
        -1;
      if (game.settings.get('torgeternity', 'playerHandBottom') === true) {
        card.style.transform = `rotateZ(${correction}deg) translateY(-700px)`;
      } else {
        card.style.transform = `rotateZ(${correction}deg)`;
      }
    } else {
      card.style.transform = card.dataset.rot;
    }
  }

  /**
   *
   */
  toggleRender() {
    if (this.rendered) {
      if (this._minimized) return this.maximize();
      else return this.close();
    } else return this.render({ force: true });
  }
}
