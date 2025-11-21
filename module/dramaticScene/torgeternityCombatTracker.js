import TorgCombatant from './torgeternityCombatant.js';
/**
 *
 */

export default class torgeternityCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {

  firstFaction = 'heroes';
  secondFaction = 'villains';

  static PARTS = {
    header: { template: "systems/torgeternity/templates/sidebar/combat-tracker-header.hbs" },
    tracker: { template: 'systems/torgeternity/templates/sidebar/combat-tracker.hbs' },
    footer: { template: "systems/torgeternity/templates/sidebar/combat-tracker-footer.hbs" }
  }

  static DEFAULT_OPTIONS = {
    // token-effects ignore the themed setting below.
    classes: ['torgeternity', 'themed', 'theme-dark'],
    actions: {
      'toggleDramatic': torgeternityCombatTracker.#toggleDramatic,
      'hasPlayed': torgeternityCombatTracker.#onHasPlayed,
      'toggleWaiting': torgeternityCombatTracker.#onToggleWaiting,
      'dsrCounter': torgeternityCombatTracker.#incStage,
      'playerDsrCounter': torgeternityCombatTracker.#incPlayerStage,
      'hasFinished': torgeternityCombatTracker.#onHasFinished,
      "dramaFlurry": torgeternityCombatTracker.#onDramaFlurry,
      "dramaInspiration": torgeternityCombatTracker.#onDramaInspiration,
      "dramaUp": torgeternityCombatTracker.#onDramaUp,
      "dramaConfused": torgeternityCombatTracker.#onDramaConfused,
      "dramaFatigued": torgeternityCombatTracker.#onDramaFatigued,
      "dramaSetback": torgeternityCombatTracker.#onDramaSetback,
      "dramaStymied": torgeternityCombatTracker.#onDramaStymied,
      "dramaSurge": torgeternityCombatTracker.#onDramaSurge,
    }
  }

  async _prepareCombatContext(context, options) {
    // for HEADER and FOOTER
    await super._prepareCombatContext(context, options);
    if (context.partId !== 'combat-header' && context.partId !== 'combat-popout-header') return;

    const combat = this.viewed;
    const heroesFirst = combat?.areHeroesFirst;
    context.firstFaction = heroesFirst ? 'heroes' : 'villains';
    context.secondFaction = !heroesFirst ? 'heroes' : 'villains';
    context.isDramatic = combat?.isDramatic;
    context.conflictLine = combat?.conflictLineText;
    context.approvedActions = combat?.approvedActionsText;
    context.dsrLine = combat?.dsrText;
    context.dramaRule = await foundry.applications.ux.TextEditor.enrichHTML(combat?.dramaRule);

    context.approved = {};
    if (combat)
      for (const action of combat.approvedActions)
        context.approved[action] = true;
    context.firstConflict = !combat ? 'none' : heroesFirst ? combat.heroConflict : combat.villainConflict;
    context.secondConflict = !combat ? 'none' : !heroesFirst ? combat.heroConflict : combat.villainConflict;

    context.hasTurn = context.combat?.combatants?.some(combatant =>
      !combatant.turnTaken && combatant.isOwner && context.combat.round);
  }

  async _prepareTrackerContext(context, options) {
    await super._prepareTrackerContext(context, options);
    if (!this.viewed) return;
    this.viewed.updateCurrentDisposition();
    context.activeTurns = context.turns?.filter(c => !c.isWaiting) ?? [];
    context.waiting = context.turns?.filter(c => c.isWaiting) ?? [];
  }

  async _prepareTurnContext(combat, combatant, index) {
    const context = await super._prepareTurnContext(combat, combatant, index);

    // If actor has been deleted, then combatant.actor will be null
    const hand = combatant.actor?.getDefaultHand();
    context.noHand = !hand;
    if (hand) {
      context.cardpool = hand.cards
        ?.filter(card => card.system.pooled)
        .map(card => { return { name: card.name, img: card.img } }) ?? [];
    }
    context.turnTaken = combatant.turnTaken;
    context.isWaiting = combatant.isWaiting;
    // There's no other place where we can update the Turn Marker when the Actor changes the waiting status
    if (combatant.wasWaiting !== undefined && combatant.wasWaiting != context.isWaiting) {
      console.log('wasWaiting', context.isWaiting);
      combatant.token?.object?.renderFlags.set({ refreshTurnMarker: true });
    }
    combatant.wasWaiting = context.isWaiting;

    context.waitingImg = CONFIG.statusEffects.find(e => e.id === 'waiting')?.img;
    context.actorType = combatant.actor?.type;
    const dispositions = {
      [CONST.TOKEN_DISPOSITIONS.SECRET]: "secret",
      [CONST.TOKEN_DISPOSITIONS.HOSTILE]: "hostile",
      [CONST.TOKEN_DISPOSITIONS.NEUTRAL]: "neutral",
      [CONST.TOKEN_DISPOSITIONS.FRIENDLY]: "friendly",
    }
    context.dsrStage = combatant.flags?.torgeternity?.dsrStage;

    // Remove "active" class from combatants since we don't use it, 
    // and Foundry's core CSS causes it to mess up the card hover function.
    const css = context.css.split(" ").filter(cls => cls !== 'active');
    if (combatant.token?.disposition !== undefined) css.push(dispositions[combatant.token.disposition]);
    if (combatant.turnTaken) css.push(' turnDone');
    context.css = css.join(" ");
    return context;
  }

  /**
   * Add an option to Shuffle the Drama Deck
   */
  _getCombatContextOptions() {
    // Remove Initiative options:
    const options = super._getCombatContextOptions().filter(
      opt => opt.name !== 'COMBAT.InitiativeReset');
    options.unshift({
      name: "torgeternity.dramaCard.getPreviousDrama",
      icon: '<i class="fa-solid fa-up-down"></i>',
      condition: game.user.isGM && !!this.viewed,
      callback: () => this.viewed.restorePreviousDrama()
    }, {
      name: "torgeternity.dramaCard.shuffleDeck",
      icon: '<i class="fa-solid fa-random"></i>',
      condition: game.user.isGM && !!this.viewed,
      callback: () => this.viewed.resetDramaDeck()
    });
    return options;
  }

  _getEntryContextOptions() {
    return super._getEntryContextOptions().filter(
      opt => opt.name !== 'COMBAT.CombatantReroll' && opt.name !== 'COMBAT.CombatantClear')
  }

  /**
   * A player has pressed the button at the bottom of the combat tracker to end "their" turn.
   * @param event
   */
  static async #onHasFinished(event, button) {
    const combatant = this.viewed?.combatants.find(combatant => combatant.actorId === game.user.character.id);
    if (!combatant) {
      ui.notifications.info('COMBAT.UnknownCombatant', { localize: true })
      return;
    }

    await combatant.setTurnTaken(true);
    this.viewed.dramaEndOfTurn(combatant);
  }

  /**
   * A player has finished their turn.
   * @param event
   */
  static async #onHasPlayed(event, button) {
    const { combatantId } = button.closest("[data-combatant-id]")?.dataset ?? {};
    const combatant = this.viewed?.combatants.get(combatantId);
    if (!combatant) return;

    const turnTaken = !combatant.turnTaken;
    await combatant.setTurnTaken(turnTaken);
    if (turnTaken) this.viewed.dramaEndOfTurn(combatant);
  }

  /**
 * Toggle the Wait status of a combatant.
 * @param event
 */
  static async #onToggleWaiting(event, button) {
    const { combatantId } = button.closest("[data-combatant-id]")?.dataset ?? {};
    const combatant = this.viewed?.combatants.get(combatantId);
    if (!combatant) return;
    await combatant.actor.toggleStatusEffect('waiting');
    combatant.token?.object?.renderFlags.set({ refreshTurnMarker: true });
  }

  updateStage(document, force) {
    let newStep;
    switch (document.getFlag('torgeternity', 'dsrStage')) {
      case undefined:
      case '': newStep = 'A'; break;
      case 'A': newStep = 'B'; break;
      case 'B': newStep = 'C'; break;
      case 'C': newStep = 'D'; break;
      case 'D': newStep = ''; break;
    }
    // DSR - check that the next step is approved by the current Drama Card
    const dsr = this.viewed?.currentDrama?.system.dsrLine;
    if (!force && dsr.length && dsr.length <= 4 && dsr.indexOf(newStep) === -1) {
      ui.notifications.info(game.i18n.format(`torgeternity.chatText.notPermittedDSR`, { step: newStep }));
      return;
    }

    document.setFlag('torgeternity', 'dsrStage', newStep);
  }

  /**
   *
   * @param event
   */
  static async #incStage(event, button) {
    if (!this.viewed || !this.viewed?.currentDrama) return;
    event.preventDefault();
    this.updateStage(this.viewed, event.shiftKey);
  }

  /**
   *
   * @param event
   */
  static async #incPlayerStage(event, button) {
    const { combatantId } = button.closest("[data-combatant-id]")?.dataset ?? {};
    const combatant = this.viewed?.combatants.get(combatantId);
    if (!combatant || !this.viewed?.currentDrama) return;
    this.updateStage(combatant, event.shiftKey);
    event.preventDefault();
  }

  /*
   * DRAMA DECK HANDLING
   */
  static #toggleDramatic(event, button) {
    const newstate = !this.viewed.isDramatic;
    this.viewed.setIsDramatic(newstate);
    console.log(`COMBAT MODE = ${newstate ? "DRAMATIC" : "STANDARD"} ==> ${this.viewed.conflictLineText}`)
  }
  static #onDramaFlurry(event, button) {
    this.viewed.dramaFlurry(button.dataset.faction);
  }
  static async #onDramaInspiration(event, button) {
    this.viewed.dramaInspiration(button.dataset.faction);
  }
  static #onDramaUp(event, button) {
    this.viewed.dramaUp(button.dataset.faction)
  }
  static #onDramaConfused(event, button) {
    this.viewed.dramaConfused(button.dataset.faction)
  }
  static #onDramaFatigued(event, button) {
    this.viewed.dramaFatigued(button.dataset.faction)
  }
  static #onDramaSetback(event, button) {
    this.viewed.dramaSetback(button.dataset.faction)
  }
  static #onDramaStymied(event, button) {
    this.viewed.dramaStymied(button.dataset.faction)
  }
  static #onDramaSurge(event, button) {
    this.viewed.dramaSurge(button.dataset.faction)
  }
}
