import { torgeternity } from '../config.js';

const FATIGUED_FACTION_FLAG = 'fatiguedFaction';
const IS_DRAMATIC_FLAG = 'isDramatic';

let firsttime;

/**
 *
 */
export default class TorgCombat extends Combat {

  #currentDisposition = CONST.TOKEN_DISPOSITIONS.SECRET;
  torgInitialized;

  /* The base Combat() class calls setupTurns, which means we can't call our own method in our override of that function */
  constructor(data, options) {
    super(data, options);
    this.torgInitialized = true;
  }

  /**
   * On deletion, remove all pooled cards from the hands of the stormknight actors in the combat.
   * @param {*} options 
   * @param {*} user 
   * @returns 
   */
  async _preDelete(options, user) {
    const allowed = super._preDelete(options, user);
    if (allowed === false) return false;

    // listing of hands' actors in closing combat
    this.combatants.filter(combatant => combatant.actor?.type === 'stormknight')
      .forEach(combatant => {
        const hand = game.actors.get(combatant.actorId).getDefaultHand();
        // delete the flag that give the pooled condition in each card of each hand
        if (hand) hand.cards.forEach(async card => await card.update({ "system.pooled": false }))
      });

    this.#deleteActiveDefense();
    return true;
  }

  /**
   * On deletion of a Combat, return the current Drama Card to the deck,
   * and let all players play cards from their hands (i.e. cancel Confused).
   * @param options
   * @param userId
   */
  _onDelete(options, userId) {
    if (game.user.isActiveGM) {
      this.setCardsPlayable(true);
      const settings = game.settings.get('torgeternity', 'deckSetting');
      const dramaDiscard = game.cards.get(settings.dramaDiscard);
      const dramaActive = game.cards.get(settings.dramaActive);
      // Discard the current Drama Card
      if (dramaDiscard && dramaActive?.cards.size > 0) {
        dramaActive.cards.contents[0].pass(dramaDiscard, game.torgeternity.cardChatOptions);
      }
    }
    super._onDelete(options, userId);
  }

  /**
   * Ensure the correct drama card image is shown in the Combat Tracker.
   * @param changed
   * @param options
   * @param userId
   */
  _onUpdate(changed, options, userId) {
    if (game.user.isActiveGM) {
      const dramaActive = game.cards.get(game.settings.get('torgeternity', 'deckSetting')?.dramaActive);
      this.setFlag('torgeternity', 'activeCard', (dramaActive?.cards.size > 0) ? dramaActive.cards.contents[0].faces[0].img : '');
    }
    super._onUpdate(changed, options, userId);
  }

  /**
   * Addition of Combatants
   * 
   * When a new combatant is added to the combat, ensure that a Hero cannot play cards if the current
   * drama card is "confused"
   * @param {Combatant} combatant
   */
  async _onEnter(combatant) {
    await super._onEnter(combatant);

    if (this.started) {
      const whoFirst = await this.getFlag('torgeternity', 'combatFirstDisposition');
      combatant.update({ initiative: this.#getInitiative(combatant, whoFirst) });

      if (combatant.token.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY && this.heroConflict === 'confused') {
        const hand = combatant.actor.getDefaultHand();
        if (hand) hand.setFlag('torgeternity', 'disablePlayCards', true)
      }
    }
  }

  /**
   * When a combatant is removed from the combat, ensure that they can play cards from their hand
   * @param {Combatant} combatant 
   */
  async _onExit(combatant) {
    // Cancel "cannot play cards"
    if (combatant.token?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY && this.heroConflict === 'confused') {
      const hand = combatant.actor.getDefaultHand();
      if (hand) hand.setFlag('torgeternity', 'disablePlayCards', false)
    }
    combatant.token?.object?.renderFlags.set({ refreshTurnMarker: true })
    return super._onExit(combatant);
  }

  get currentDrama() {
    const dramaActive = game.cards.get(game.settings.get('torgeternity', 'deckSetting').dramaActive);
    return dramaActive.cards.size ? dramaActive.cards.contents[0] : null;
  }

  async setIsDramatic(value) {
    const result = await this.setFlag('torgeternity', IS_DRAMATIC_FLAG, value)
    if (!result) return;  // unchanged

    // Update combat effects
    const card = this.currentDrama;
    if (card) return this.#setDramaEffects(card);
  }

  get isDramatic() {
    return this.getFlag('torgeternity', IS_DRAMATIC_FLAG) ?? false;
  }

  get approvedActions() {
    return this.currentDrama?.system.approvedActions?.split(' ') ?? [];
  }

  get heroConflict() {
    const card = this.currentDrama;
    if (!card) return 'none';
    return this.isDramatic ? card.system.heroesConditionsDramatic : card.system.heroesConditionsStandard;
  }

  get villainConflict() {
    const card = this.currentDrama;
    if (!card) return 'none';
    return this.isDramatic ? card.system.villainsConditionsDramatic : card.system.villainsConditionsStandard;
  }

  get areHeroesFirst() {
    const card = this.currentDrama;
    if (!card) return false;
    return this.isDramatic ? card.system.heroesFirstDramatic : card.system.heroesFirstStandard;
  }

  /**
   * 
   */
  async resetDramaDeck() {
    const dramaDeck = game.cards.get(game.settings.get('torgeternity', 'deckSetting').dramaDeck);
    if (!dramaDeck) return;
    await dramaDeck.recall();
    await dramaDeck.shuffle();
    // Mark no active drama card
    await this.setFlag('torgeternity', 'activeCard', '');
    await this.setCardsPlayable(true);
  }

  /**
   * Extra work when a drama card is drawn
   */

  async drawDramaCard() {
    const settings = game.settings.get('torgeternity', 'deckSetting');
    const dramaDeck = game.cards.get(settings.dramaDeck);
    const dramaDiscard = game.cards.get(settings.dramaDiscard);
    const dramaActive = game.cards.get(settings.dramaActive);

    // Discard the current Drama Card
    if (dramaDiscard && dramaActive?.cards.size > 0)
      await dramaActive.cards.contents[0].pass(dramaDiscard, game.torgeternity.cardChatOptions);

    if (!dramaDeck?.availableCards.length) {
      ui.notifications.info(game.i18n.localize('torgeternity.notifications.dramaDeckEmpty'));
      return;
    }

    const [card] = await dramaActive.draw(dramaDeck, 1, game.torgeternity.cardChatOptions);
    return this.#setDramaEffects(card);
  }

  /**
   * Set the effects of the current drama card
   */
  async #setDramaEffects(card) {
    //console.log(this.conflictLineText)
    //console.log(`DSR: '${this.dsrText}'   Actions: '${this.approvedActionsText}'`);

    await this.setFlag('torgeternity', 'activeCard', card ? card.faces[0].img : '');

    // Sort combatants based on which faction is first
    const whoFirst = (this.isDramatic ? card.system.heroesFirstDramatic : card.system.heroesFirstStandard) ? CONST.TOKEN_DISPOSITIONS.FRIENDLY : CONST.TOKEN_DISPOSITIONS.HOSTILE;
    await this.setFlag('torgeternity', 'combatFirstDisposition', whoFirst);

    const updates = [];
    for (const combatant of this.turns) {
      updates.push({ _id: combatant.id, initiative: this.#getInitiative(combatant, whoFirst) });
    }
    if (updates.length) {
      await this.updateEmbeddedDocuments("Combatant", updates, { turnEvents: false });
      this.setupTurns();
    }
    for (const combatant of this.turns)
      combatant.token?.object?.renderFlags.set({ refreshTurnMarker: true });
  }

  #getInitiative(combatant, whoFirst) {
    return (!combatant.token || combatant.token.disposition === CONST.TOKEN_DISPOSITIONS.NEUTRAL) ? 1 : (combatant.token.disposition === whoFirst) ? 3 : 2;
  }

  get conflictLineText() {
    const card = this.currentDrama;
    if (!card) return "No Drama Card Active";

    const lookup = (a) => game.i18n.localize(torgeternity.dramaConflicts[a]);
    const H = game.i18n.localize('torgeternity.dramaCard.heroesConflict');
    const V = game.i18n.localize('torgeternity.dramaCard.villainsConflict');
    if (this.isDramatic) {
      if (card.system.heroesFirstDramatic)
        return `${game.i18n.localize('torgeternity.dramaCard.dramatic')}: ${H} ${lookup(card.system.heroesConditionsDramatic)}   ${V} ${lookup(card.system.villainsConditionsDramatic)}`
      else
        return `${game.i18n.localize('torgeternity.dramaCard.dramatic')}: ${V} ${lookup(card.system.villainsConditionsDramatic)}   ${H} ${lookup(card.system.heroesConditionsDramatic)}`
    } else {
      if (card.system.heroesFirstStandard)
        return `${game.i18n.localize('torgeternity.dramaCard.standard')}: ${H} ${lookup(card.system.heroesConditionsStandard)}   ${V} ${lookup(card.system.villainsConditionsStandard)}`
      else
        return `${game.i18n.localize('torgeternity.dramaCard.standard')}: ${V} ${lookup(card.system.villainsConditionsStandard)}   ${H} ${lookup(card.system.heroesConditionsStandard)}`
    }
  }

  get approvedActionsText() {
    const card = this.currentDrama;
    if (!card) return "No Drama Card Active";
    return this.approvedActions.map(one => game.i18n.localize(torgeternity.dramaActions[one])).join('/');
  }

  get dsrText() {
    const dsr = this.currentDrama?.system.dsrLine;
    if (!dsr) return "No Drama Card Active";
    const first = dsr.at(0);
    return (first === first.toUpperCase()) ? dsr.split('').join(' ') : game.i18n.localize(torgeternity.dramaActions[dsr]);
  }

  get dramaRule() {
    return this.currentDrama?.system.rule;
  }

  /**
   * 
   */
  async startCombat() {
    // Active GM draws the next available drama card
    if (game.user.isActiveGM) await this.drawDramaCard();
    return super.startCombat();
  }
  /**
   *
   */
  async nextRound() {
    if (!game.user.isActiveGM) return super.nextRound();

    await this.drawDramaCard();

    // deactivate active defense when the combat round is progressed. End of combat is in the hook above, 'deleteCombat'
    await this.#deleteActiveDefense();

    // Perform end-of-faction's turn processing
    return this.nextRoundKeep();
  }

  /**
   *
   */
  async nextRoundKeep() {
    await this.updateEmbeddedDocuments('Combatant',
      this.combatants.map((combatant) => ({
        _id: combatant.id,
        'flags.world.turnTaken': false,
        'flags.torgeternity.-=multiAction': null
      })),
      { updateAll: true });
    this.setCardsPlayable(true);
    this.unsetFlag('torgeternity', FATIGUED_FACTION_FLAG);
    return super.nextRound();
  }

  /**
   * Remove the ActiveDefense AE from all combatants.
   */
  async #deleteActiveDefense() {
    return Promise.all(this.combatants.map(combatant => combatant.actor?.activeDefense?.delete()));
  }


  /*
   * DRAMA DECK HANDLING
   */
  getCombatantFaction(combatant) {
    return (combatant.token.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) ? 'heroes' : 'villains';
  }
  getFactionActors(faction) {
    const disposition = (faction === 'heroes') ? CONST.TOKEN_DISPOSITIONS.FRIENDLY : CONST.TOKEN_DISPOSITIONS.HOSTILE;
    return this.turns.filter(combatant => combatant.token?.disposition === disposition && combatant.actor).map(combatant => combatant.actor);
  }
  setCardsPlayable(value) {
    for (const actor of this.getFactionActors('heroes')) {
      const hand = actor.getDefaultHand();
      // use 'disablePlayCards' so that when the flag is undefined, cards can be played
      if (hand) hand.setFlag('torgeternity', 'disablePlayCards', !value)
    }
  }

  #sendDramaChat(action, faction) {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: game.user.name }),
      content: game.i18n.format(`torgeternity.drama.${action}Desc`,
        { faction: game.i18n.localize(`torgeternity.combat.${faction}`) })
    });
  }

  async dramaFlurry(faction) {
    // extra turn
    console.log('Drama Flurry', faction)
    this.#sendDramaChat('flurry', faction);
  }

  async dramaInspiration(faction) {
    console.log('Drama Inspiration', faction)
    this.#sendDramaChat('inspiration', faction);

    // immediately recover 2 shock (see macros.js:reviveShock)
    let chatOutput = `<h2>${game.i18n.localize(
      'torgeternity.macros.reviveMacroChatHeadline'
    )}</h2><p>${game.i18n.localize('torgeternity.macros.reviveMacroFirst')}<p><ul>`;

    for (const actor of this.getFactionActors(faction)) {
      const shock = actor.system.shock.value;
      if (shock === 0) continue;
      const reviveAmount = Math.min(shock, 2);
      await actor.update({ 'system.shock.value': shock - reviveAmount });
      chatOutput += `<li>${actor.name} ${game.i18n.localize('torgeternity.macros.reviveMacroCharPartyRevived')}${reviveAmount}`;
      if (actor.hasStatusEffect('unconscious')) {
        actor.toggleStatusEffect('unconscious', { active: false });
        chatOutput += `<br>${game.i18n.localize('torgeternity.macros.reviveMacroCharDeKOed')} ${actor.name}`;
      }
      chatOutput += '</ul>';
    }
    return ChatMessage.create({ content: chatOutput });
  }

  async dramaUp(faction) {
    // UP on first roll for each actor
    console.log('Drama Up', faction)
    this.#sendDramaChat('up', faction);
  }

  async dramaConfused(faction) {
    // unable to play Cards from their pool
    console.log('Drama Confused', faction)
    this.setCardsPlayable(false);
    this.#sendDramaChat('confused', faction);
  }

  async dramaFatigued(faction) {
    // At the end of an Actor's turn, they take 2 points of shock
    console.log('Drama Fatigued', faction)
    this.setFlag('torgeternity', FATIGUED_FACTION_FLAG, faction);
    this.#sendDramaChat('fatigued', faction);
  }

  async dramaSetback(faction) {
    // GM decides a likely setback
    console.log('Drama Setback', faction)
    this.#sendDramaChat('setback', faction);
  }

  async dramaStymied(faction) {
    // All Actors become Stymied until the end of their next turn
    console.log('Drama Stymied', faction)
    this.#sendDramaChat('stymied', faction);
    for (const actor of this.getFactionActors(faction))
      actor.applyStymiedState('stymied', faction);
  }

  async dramaSurge(faction) {
    // All Actors must check for Contradictions (TCR 178)
    console.log('Drama Surge', faction)
    //this.#sendDramaChat('surge', faction);

    const scene = this.scene ?? game.scenes.active;
    console.log('SURGE axiom limits: ', scene.torg.axioms)

    let chatOutput = `<h2>${game.i18n.localize('torgeternity.drama.surge')}!</h2><ul>`;
    //const cosm = this.
    for (const actor of this.getFactionActors(faction)) {
      // Any character who is not from that reality,
      // or has something foreign to that reality on their person.

      // Ignore actors from the scene's reality
      const fromReality = scene.hasCosm(actor.system.other.cosm);
      const itemContradictsActor = actor.items.find(item => item.isContradiction(actor.system.axioms));
      const itemContradictsCosm = actor.items.find(item => item.isGeneralContradiction(scene) || (!scene.hasCosm(item.system.cosm) && item.isContradiction(scene.torg.axioms)));

      chatOutput += `<li class="contradiction-roll"><strong>${actor.name}:</strong> `
      if (actor.isDisconnected) {
        chatOutput += ` ${game.i18n.localize('torgeternity.chatText.contradiction.alreadyDisconnected')}`;
      } else if (!itemContradictsActor && !itemContradictsCosm) {
        // axioms of cosm === axioms of actor
        chatOutput += ` ${game.i18n.localize('torgeternity.chatText.contradiction.noContradiction')}`;
        continue;
      } else {
        const FourCase = fromReality || (itemContradictsCosm && itemContradictsActor);
        chatOutput += ` ${game.i18n.localize('torgeternity.chatText.contradiction.possibleContradiction')} `;
        chatOutput += foundry.applications.ux.TextEditor.createAnchor({
          dataset: {
            limit: FourCase ? 4 : 1,
            uuid: actor.uuid,
            tooltip: game.i18n.format('torgeternity.chatText.contradiction.checkTooltip', { name: actor.name })
          },
          name: FourCase ? '{1-4}' : '{1}',
          classes: ['torg-inline-contradiction'],
          icon: "fa-solid fa-dice-d20"
        }).outerHTML;
      }

      chatOutput += '</li>';
    }

    chatOutput += `</ul>`;
    return ChatMessage.create({ content: chatOutput });
  }

  /**
   * General end-of-character turn processing
   */
  dramaEndOfTurn(combatant) {
    this.updateCurrentDisposition();

    if (this.getFlag('torgeternity', FATIGUED_FACTION_FLAG) === this.getCombatantFaction(combatant)) {
      const actor = combatant.actor;
      if (!actor) return;

      let chatOutput = `<h2>${game.i18n.localize(
        'torgeternity.sheetLabels.fatigue'
      )}!</h2><p>${game.i18n.localize('torgeternity.macros.fatigueMacroDealtDamage')}</p><ul>`;

      if (actor.hasStatusEffect('unconscious')) {
        chatOutput += `<li>${actor.name} ${game.i18n.localize('torgeternity.macros.fatigueMacroCharAlreadyKO')}</li>`;
      }

      const shockIncrease = actor.fatigue;
      const applyResult = actor.applyDamages(/*shock*/ shockIncrease, /*wounds*/ 0);

      chatOutput += `<li>${actor.name}: ${shockIncrease} ${game.i18n.localize('torgeternity.sheetLabels.shock')}`;
      if (applyResult.shockExceeded) {
        chatOutput += `<br><strong>${actor.name}${game.i18n.localize('torgeternity.macros.fatigueMacroCharKO')}</strong>`;
      }
      chatOutput += '</li>';

      chatOutput += '</ul>';
      return ChatMessage.create({ content: chatOutput });
    }
  }
  /**
   * Restore the previous Drama Card
   */
  async restorePreviousDrama() {
    if (!game.user.isGM) return;

    const settings = game.settings.get('torgeternity', 'deckSetting');
    const dramaDeck = game.cards.get(settings.dramaDeck);
    const dramaDiscard = game.cards.get(settings.dramaDiscard);
    const dramaActive = game.cards.get(settings.dramaActive);
    if (!dramaDeck || !dramaDiscard || !dramaActive) return;

    const currActiveCard = Array.from(dramaActive.cards).pop();
    const prevActiveCard = Array.from(dramaDiscard.cards).pop();
    // Ignore game.torgeternity.cardChatOptions, since no explicit chat message sent here
    await currActiveCard.pass(dramaDeck);
    await prevActiveCard.pass(dramaActive);

    // Cancel effects from previous card (if any)
    return this.#setDramaEffects(prevActiveCard);
  }

  // Sort by initiative, and then by name.
  _sortCombatants(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -Infinity;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -Infinity;
    if (ia === ib)
      return (a.name < b.name) ? -1 : 1;
    else
      return (ib - ia) || (a.id > b.id ? 1 : -1);
  }

  // setupTurns is called from Combat() constructor, so this.updateCurrentDisposition is not fully created yet
  setupTurns() {
    const turns = super.setupTurns();
    if (this.torgInitialized) this.updateCurrentDisposition();
    return turns;
  }

  updateCurrentDisposition() {
    // Find first combatant whose turn has NOT been taken (after sorting).
    const old = this.#currentDisposition;
    const firstNotTaken = this.turns?.find(combatant => !combatant.turnTaken && !combatant.isWaiting);
    this.#currentDisposition = firstNotTaken?.token.disposition ?? CONST.TOKEN_DISPOSITIONS.SECRET;

    if (this.#currentDisposition != old)
      for (const combatant of this.turns)
        combatant.token?.object?.renderFlags.set({ refreshTurnMarker: true });
  }

  get currentDisposition() {
    return this.#currentDisposition;
  }

  static async _onClickContradiction(event) {
    const target = event.target.closest('a.torg-inline-contradiction');
    const limit = target.dataset.limit;
    const actor = fromUuidSync(target.dataset.uuid);
    // Silently ignore clicks if user is not the owner.
    if (!actor.isOwner) return;

    // Special case of the actor NOW being disconnected
    if (actor.isDisconnected) {
      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<p class="contradiction-roll">${actor.name} ${game.i18n.localize('torgeternity.chatText.contradiction.alreadyDisconnected')}</p>`
      })
    }

    // Perform the roll
    const rollData = actor ? actor.getRollData() : {};
    const roll = await foundry.dice.Roll.create(`d20cs>${limit}`, rollData).roll();
    console.log(roll);
    const success = roll.result === '1';

    let result;
    if (!success) {
      if (game.settings.get('torgeternity', 'autoDisconnect'))
        await actor.toggleStatusEffect('disconnected', { active: true });
      result = game.i18n.localize('torgeternity.chatText.contradiction.hasDisconnected');
    } else {
      result = game.i18n.localize('torgeternity.chatText.contradiction.notDisconnected');
    }
    const dieNum = roll.dice[0].values[0];
    const content = `<h2>${game.i18n.localize('torgeternity.chatText.contradiction.contradictionCheck')}</h2>
      <p class="contradiction-roll ${success ? '' : 'disconnection'}">${actor.name} ${result}</p>
      <div class="dice-roll-torg">
          <div class="dice-result">
            <div class="dice-tooltip expanded" style="display: block;">
              <section class="tooltip-part">
                <div class="dice">
      <ol class="dice-rolls">
      <li class="roll die d20" 
      ${game.settings.get('torgeternity', 'useRenderedTorgDice') ? 'style="background-image: url(systems/torgeternity/images/Torgd20.svg);";' : ''}>${dieNum}</li>
      </ol>
                </div>
              </section>
            </div>
          </div>
        </div> 
      </div> `;

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content
    })
  }
}


Hooks.once('setup', async function () {
  document.body.addEventListener('click', event => {
    if (event.target?.closest("a.torg-inline-contradiction"))
      TorgCombat._onClickContradiction(event);
  })
})