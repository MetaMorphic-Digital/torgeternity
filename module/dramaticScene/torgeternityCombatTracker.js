import TorgCombatant from './torgeternityCombatant.js';
/**
 *
 */

export default class torgeternityCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {

  // `wasWaiting` is stored on the object only in-memory.

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
      'hasPlayedGroup': torgeternityCombatTracker.#onHasPlayedGroup,
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
      "deleteGroup": torgeternityCombatTracker.#askDeleteGroup,
      "toggleGroup": torgeternityCombatTracker.#onToggleGroup,
      "toggleHiddenGroup": torgeternityCombatTracker.#onToggleHiddenGroup,
      "toggleDefeatedGroup": torgeternityCombatTracker.#onToggleDefeatedGroup,
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
    const combat = this.viewed;
    if (!combat) return;

    await this._prepareGroupContext(context, combat);

    context.activeTurns = context.turns?.filter(c => !c.isWaiting) ?? [];
    context.waiting = context.turns?.filter(c => c.isWaiting && (c.isGroup || !c.group)) ?? [];
  }

  async _prepareGroupContext(context, combat) {
    let index = context.turns.length;

    for (const group of combat.groups) {
      let members = [];
      for (const combatant of group.members)
        members.push(await this._prepareTurnContext(combat, combatant, index++));

      const numDefeated = group.members.filter(m => m.isDefeated).size;
      const isDefeated = group.members.size && numDefeated === group.members.size;
      const isWaiting = !group.members.find(m => !m.isWaiting);
      const groupTurn = {
        id: group.id,
        name: group.name,
        disposition: group.disposition,
        initiative: group.members.first()?.initiative,
        isOpen: group.isOpen ? "open" : "",
        isGroup: true,
        isDefeated,
        hidden: group.hidden,
        isWaiting,
        turnTaken: group.turnTaken,
        activeCount: numDefeated && (group.members.size - numDefeated), // Set
        members,
      };
      const css = [];
      if (group.turnTaken) css.push(' turnDone');
      groupTurn.css = css.join(" ");

      // Find correct position in context.turns
      let done = false;
      for (const [idx, entry] of Object.entries(context.turns)) {
        if (!entry.group && groupTurn.initiative > Number(entry.initiative)) {
          context.turns.splice(idx, 0, groupTurn);
          done = true;
          break;
        }
      }
      if (!done) context.turns.push(groupTurn);
    }
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
    context.group = combatant.group;

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
    }, {
      name: "torgeternity.CombatantGroup.newGroup",
      icon: '<i class="fa-solid fa-random"></i>',
      condition: game.user.isGM && !!this.viewed,
      callback: async () => {
        const groupName = await foundry.applications.api.DialogV2.prompt({
          window: { title: "Combatant Group Creation" },
          content: '<input name="groupName" type="string" autofocus>',
          ok: {
            label: "Create Group",
            callback: (event, button, dialog) => button.form.elements.groupName.value
          }
        });
        if (groupName) this.viewed.createGroup(groupName);
      }
    });
    return options;
  }

  _getEntryContextOptions() {
    const getCombatant = li => this.viewed.combatants.get(li.dataset.combatantId);
    function canAddToGroup(li) {
      const combatant = getCombatant(li);
      return !combatant?.group &&
        !!combat.groups.find(group => group.disposition === undefined || group.disposition === combatant.token.disposition);
    }

    const options = super._getEntryContextOptions().filter(
      opt => opt.name !== 'COMBAT.CombatantReroll' && opt.name !== 'COMBAT.CombatantClear');

    const combat = this.viewed;

    options.push(
      {
        name: "torgeternity.CombatantGroup.removeFromGroup",
        icon: '<i class="fa-solid fa-xmark"></i>',
        condition: li => game.user.isGM && !!this.viewed && getCombatant(li).group,
        callback: async li => getCombatant(li)?.update({ group: null }),
      },
      {
        name: "torgeternity.CombatantGroup.addToGroup",
        icon: '<i class="fa-solid google-plus"></i>',
        condition: li => game.user.isGM && !!this.viewed && canAddToGroup(li),
        callback: torgeternityCombatTracker.#askAddToGroup.bind(this, false),
      },
      {
        name: "torgeternity.CombatantGroup.addAllToGroup",
        icon: '<i class="fa-solid google-plus"></i>',
        condition: li => game.user.isGM && !!this.viewed && canAddToGroup(li),
        callback: torgeternityCombatTracker.#askAddToGroup.bind(this, true),
      })

    return options;
  }

  /**
   * A player has pressed the button at the bottom of the combat tracker to end "their" turn.
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} _button 
   */
  static async #onHasFinished(_event, _button) {
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
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static async #onHasPlayed(_event, button) {
    const { combatantId } = button.closest("[data-combatant-id]")?.dataset ?? {};
    const combatant = this.viewed?.combatants.get(combatantId);
    if (!combatant) return;

    const turnTaken = !combatant.turnTaken;
    await combatant.setTurnTaken(turnTaken);
    if (turnTaken) this.viewed.dramaEndOfTurn(combatant);
  }

  /**
   * Toggle the Wait status of a combatant.
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static async #onToggleWaiting(_event, button) {
    const { combatantId } = button.closest("[data-combatant-id]")?.dataset ?? {};
    const combatant = this.viewed?.combatants.get(combatantId);
    if (!combatant) return;
    await combatant.actor.toggleStatusEffect('waiting');
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
   * @this {torgeternityCombatTracker}
   * @param {Event} event 
   * @param {HTMLButtonElement} button 
   */
  static async #incStage(event, button) {
    if (!this.viewed || !this.viewed?.currentDrama) return;
    event.preventDefault();
    this.updateStage(this.viewed, event.shiftKey);
  }

  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} event 
   * @param {HTMLButtonElement} button 
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
  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static #toggleDramatic(_event, _button) {
    const newstate = !this.viewed.isDramatic;
    this.viewed.setIsDramatic(newstate);
    console.log(`COMBAT MODE = ${newstate ? "DRAMATIC" : "STANDARD"} ==> ${this.viewed.conflictLineText}`)
  }
  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static #onDramaFlurry(_event, button) {
    this.viewed.dramaFlurry(button.dataset.faction);
  }
  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static async #onDramaInspiration(_event, button) {
    this.viewed.dramaInspiration(button.dataset.faction);
  }
  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static #onDramaUp(_event, button) {
    this.viewed.dramaUp(button.dataset.faction)
  }
  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static #onDramaConfused(_event, button) {
    this.viewed.dramaConfused(button.dataset.faction)
  }
  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static #onDramaFatigued(_event, button) {
    this.viewed.dramaFatigued(button.dataset.faction)
  }
  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static #onDramaSetback(_event, button) {
    this.viewed.dramaSetback(button.dataset.faction)
  }
  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static #onDramaStymied(_event, button) {
    this.viewed.dramaStymied(button.dataset.faction)
  }
  /**
   * @this {torgeternityCombatTracker}
   * @param {Event} _event 
   * @param {HTMLButtonElement} button 
   */
  static #onDramaSurge(_event, button) {
    this.viewed.dramaSurge(button.dataset.faction)
  }

  static async #askDeleteGroup(event, button) {
    const group = this.viewed.groups.get(button.dataset.combatantGroupId);
    if (!group) return;
    if (await foundry.applications.api.DialogV2.confirm({
      content: game.i18n.format('torgeternity.CombatantGroup.reallyDelete', group.name),
      rejectClose: false,
      modal: true
    }))
      return this.viewed.deleteGroup(group);
  }

  static async #onToggleGroup(event, button) {
    const group = this.viewed.groups.get(button.closest('li.combatantGroup')?.dataset.groupId);
    if (group) group.isOpen = !button.open;
  }

  static async #onHasPlayedGroup(event, button) {
    const group = this.viewed.groups.get(button.closest('li.combatantGroup')?.dataset.groupId);
    if (!group) return;
    const turnTaken = !group.turnTaken;

    for (const combatant of group.members) {
      if (combatant.turnTaken === turnTaken) continue;
      await combatant.setTurnTaken(turnTaken);
      if (turnTaken) this.viewed.dramaEndOfTurn(combatant);
    }
  }

  static async #onToggleHiddenGroup(event, button) {
    const group = this.viewed.groups.get(button.closest('li.combatantGroup')?.dataset.groupId);
    if (!group) return;
    const newState = !group.hidden;
    for (const combatant of group.members)
      combatant.update({ hidden: newState });
  }

  static async #onToggleDefeatedGroup(event, button) {
    const group = this.viewed.groups.get(button.closest('li.combatantGroup')?.dataset.groupId);
    if (!group) return;
    const isDefeated = !group.defeated;
    for (const combatant of group.members) {
      if (combatant.isDefeated === isDefeated) continue;
      await combatant.update({ defeated: isDefeated });
      const defeatedId = CONFIG.specialStatusEffects.DEFEATED;
      await combatant.actor?.toggleStatusEffect(defeatedId, { overlay: true, active: isDefeated });
    }
  }

  static async #askAddToGroup(askAll, li) {
    const combat = this.viewed;
    const combatant = combat.combatants.get(li.dataset.combatantId); // getCombatant(li)
    let combatants;
    if (askAll) {
      if (combatant.actor.type === 'stormknight') {
        combatants = combat.combatants.filter(combatant => combatant.actor.type === 'stormknight');
      } else {
        const matchid = combatant.actor._source._id;
        combatants = combat.combatants.filter(combatant => combatant.actor._source._id === matchid);
      }
    } else
      combatants = [combatant];

    const validDisposition = combatant.token.disposition;
    const validGroups = combat.groups.filter(group => group.disposition === undefined || group.disposition === validDisposition);
    if (validGroups.length < 1)
      return ui.notifications.info('torgeternity.CombatantGroup.noValidGroup', { localize: true });

    // Only one group? Then add immediately to that group
    let group;
    if (validGroups.length === 1) {
      group = validGroups[0];
    } else {
      const select = foundry.applications.fields.createSelectInput({
        name: 'groupName',
        options: validGroups.map(group => { return { value: group.id, label: group.name } })
      });
      const groupId = await foundry.applications.api.DialogV2.prompt({
        window: { title: "torgeternity.CombatantGroup.whichGroup" },
        content: select.outerHTML,
        ok: {
          label: "torgeternity.submit.apply",
          callback: (event, button, dialog) => button.form.elements.groupName.value
        }
      });
      if (!groupId) return;
      group = combat.groups.get(groupId);
    }
    if (group)
      combatants.map(combatant => combatant.update({ group }));
  }
}
