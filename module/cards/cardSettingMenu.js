import torgeternityDeck from './torgeternityDeck.js';
/**
 *
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

const NOT_SELECTED_LABEL = '----';
export default class DeckSettingMenu extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    classes: ['torgeternity', 'deckSetting', 'themed', 'theme-dark'],
    tag: 'form',
    window: {
      title: 'torgeternity.settingMenu.deckSetting.name',
      contentClasses: ['standard-form'],
    },
    form: {
      handler: DeckSettingMenu.#onSubmit,
      closeOnSubmit: true,
    },
    position: {
      top: 300,
      left: 500,
    },
    actions: {
      createCards: DeckSettingMenu.#onCreateCards
    }
  }

  static PARTS = {
    form: { template: 'systems/torgeternity/templates/cards/settingMenu.hbs', scrollable: [""] },
    footer: { template: "templates/generic/form-footer.hbs" },
  }

  /**
   *
   * @param {object} settings - The settings object.
   */
  constructor(settings) {
    super();
    this.doubledValues = [];
  }

  /**
   *
   * @inheritDoc
   */
  async _prepareContext(options) {
    const cosms = {};
    for (const cosm in CONFIG.torgeternity.cosmTypes) {
      if (cosm === 'none' || cosm === 'other') continue;
      cosms[cosm] = { name: game.i18n.localize(`torgeternity.cosmDecks.${cosm}`) };
    }

    const data = {
      isGM: game.user.isGM,
      deckList: game.cards.contents,
      object: game.settings.get('torgeternity', 'deckSetting'),
      stormknights: game.actors.filter((act) => act.type === 'stormknight'),
      cosms,
      piles: game.cards
        .filter((c) => c.type === 'pile')
        .reduce((acc, pile) => {
          acc[pile.id] = pile.name;
          return acc;
        }, { [torgeternityDeck.UNUSED_DECK_ID]: NOT_SELECTED_LABEL }),
      decks: game.cards
        .filter((c) => c.type === 'deck')
        .reduce((acc, pile) => {
          acc[pile.id] = pile.name;
          return acc;
        }, { [torgeternityDeck.UNUSED_DECK_ID]: NOT_SELECTED_LABEL }),
      hands: game.cards
        .filter((c) => c.type === 'hand')
        .reduce((acc, pile) => {
          acc[pile.id] = pile.name;
          return acc;
        }, { [torgeternityDeck.UNUSED_DECK_ID]: NOT_SELECTED_LABEL }),
      buttons: [
        { type: "button", action: "createCards", icon: "fa-solid fa-plus", label: "DOCUMENT.Cards" },
        { type: "submit", action: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" },
        { type: "button", action: "close", icon: "fa-solid fa-ban", label: "Cancel" },
      ]
    };
    for (const sk of data.stormknights) {
      data.stormknights[sk.id] = sk.getDefaultHand()?.id;
    }
    return foundry.utils.mergeObject(await super._prepareContext(options), data);
  }

  /**
   *
   * @inheritDoc
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    // checking if doubled values
    this.#checkDoubled();

    // adding hook on for refreshing the display while a card stack is created
    // avoid having to re-open the menu to have new card stack available in selects
    Hooks.on('createCards', (card, options, id) => {
      if (this.rendered) {
        this.render({ force: true });
      }
    });
  }
  /**
   * 
   * @inheritDoc
   */
  _onChangeForm(formConfig, event) {
    const elem = event.target;
    const html = this.element;
    if (elem.nodeName !== 'SELECT') return;
    if (elem.classList.contains("selectDeck"))
      this.#onChangeDeck(html, event);
    if (elem.classList.contains("stormknightHand"))
      this.#onChangeHand(html, event);
  }

  /**
   *
   * @param {Event} event The event object.
   * @param {object} formData The form data compiled by foundry.
   */
  static #onSubmit(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object);
    // Update the icons in the Cards Directory
    game.settings.set('torgeternity', 'deckSetting', data).then(() => ui.cards.render())
  }
  /**
   *
   * @param {Event} event The event object.
   */
  static #onCreateCards(event) {
    event.preventDefault();
    Cards.createDialog();
  }

  /**
   *
   * @param {HTMLElement} html The html element of the setting menu sheet.
   * @param {Event} event The event object.
   */
  #onChangeDeck(html, event) {
    // getting selected value

    // checking if other select/options have same value
    this.#checkDoubled();

    // checking if other select are not doubled anymore
    for (const select of html.querySelectorAll('select')) {
      if (this.doubledValues.indexOf(select.value) === -1) {
        select.classList.remove('doubled');
      }
    }

    // allowing submit if no doubled value
    this.element.querySelectorAll('button[type="submit"]')[0].disabled = (this.element.querySelectorAll('.doubled').length > 0);
  }
  /**
   *
   * @param {HTMLElement} html The html element of the setting menu sheet.
   * @param {Event} event The event object.
   */
  #onChangeHand(html, event) {
    const actorId = event.target.dataset.actorId;
    const handId = event.target.value;

    const actor = game.actors.get(actorId);
    const hand = game.cards.get(handId);
    const oldHand = actor.getDefaultHand();

    for (const elem of html.querySelectorAll(`select:not([data-actor-id="${actorId}"])`)) {
      if (elem.value === handId || (oldHand && elem.value === oldHand.id)) {
        return;
      }
    }
    if (oldHand && handId === oldHand.id) {
      return;
    }

    // assigning same permissions from actor to hand
    if (hand)
      hand.update({
        ownership: actor.getHandOwnership(),
        flags: { torgeternity: { defaultHand: actor.id } },
      });
    if (oldHand) oldHand.setFlag('torgeternity', 'defaultHand', null);
  }
  /**
   *
   */
  #checkDoubled() {
    const selectedValues = [];

    for (const select of this.element.querySelectorAll('select')) {
      const value = select.options[select.selectedIndex].value;
      if (value === NOT_SELECTED_LABEL) continue;

      selectedValues.push(value);
      const valueCount = selectedValues.filter((val) => val === value).length;

      if (valueCount > 1) {
        this.doubledValues.push(value);
      } else {
        if (this.doubledValues.indexOf(value) > -1) {
          this.doubledValues = this.doubledValues.filter((val) => val != value);
        }
      }
    }
    for (const select of this.element.querySelectorAll('select')) {
      const value = select.options[select.selectedIndex].value;
      if (value === NOT_SELECTED_LABEL) continue;

      if (this.doubledValues.indexOf(value) > -1) {
        select.classList.add('doubled');
      } else {
        select.classList.remove('doubled');
      }
    }
  }
}
