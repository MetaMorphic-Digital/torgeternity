import TorgeternityChatLog from '../torgeternityChatLog.js';

/**
 *
 */
export class torgeternityCard extends Card {

  /**
   * If a card's pooled state is changed, then update the Combat Tracker to show the new set of pooled cards.
   * @inheritDoc
   */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    if (changed.system?.pooled !== undefined && ui.combat)
      ui.combat.render({ parts: ["tracker"] });
  }

  static migrateData(source) {
    if (source.flags?.torgeternity?.pooled !== undefined) {
      source.system.pooled = source.flags.torgeternity.pooled;
      delete source.flags.torgeternity.pooled;
    }
    if (!source.value && source.system?.number) {
      source.value = source.system.number;
    }
    return super.migrateData(source);
  }

  async discard(actorId) {
    await this.update({ "system.pooled": false });
    const settings = game.settings.get('torgeternity', 'deckSetting');
    const discardPile = game.cards.get((this.type === 'destiny') ? settings.destinyDiscard : settings.cosmDiscard);
    if (!discardPile) return;
    await this.pass(discardPile, game.torgeternity.cardChatOptions);
    if (this.system?.macro)
      await this.executeMacro('discard', actorId);
    return this.toMessage({
      content: `<div class="card-draw flexrow"><span class="card-chat-tooltip">
            <img class="card-face" src="${this.img}"/><span><img src="${this.img}"></span></span>
            <span class="card-name">${_loc('torgeternity.chatText.discardsCard')} ${this.name}</span>
            </div>`,
    });
  }

  async executeMacro(operation, actorId) {
    if (this.system?.macro) {
      const macro = await fromUuid(this.system?.macro);
      if (macro) {
        console.debug(`Card played '${this.name}': Invoking Macro '${macro.name}'`);
        const actor = game.actors.get(actorId);
        const context = { operation, card: this };
        if (actor) context.actor = actor; // Use the actor whose card is being played
        macro.execute(context);
      } else {
        console.error(`Unknown Macro on card ${this.name}`);
      }
    }
  }

  /**
   * 
   * @param {Boolean} applyAutomation Whether automatic actions on the card should be applied
   * @param {documentId} actorId ID of the actor affected by automated actions
   * @returns 
   */
  async play(applyAutomation, actorId) {
    await this.update({ "system.pooled": false });
    const settings = game.settings.get('torgeternity', 'deckSetting');
    const discardPile = game.cards.get((this.type === 'destiny') ? settings.destinyDiscard : settings.cosmDiscard);
    if (!discardPile) return;
    await this.pass(discardPile, game.torgeternity.cardChatOptions);
    await this.toMessage({
      content: `<div class="card-draw flexrow"><span class="card-chat-tooltip">
                <img class="card-face" src="${this.img}"/><span><img src="${this.img}"></span></span>
                <span class="card-name">${_loc('torgeternity.chatText.playsCard')} ${this.name}</span>
                </div>`,
    });

    if (this.system?.macro)
      await this.executeMacro('play', actorId);

    // Update the owner's most recent chat card if a Drama, Hero or +3 card
    const special = this.system?.special;
    if (special &&
      game.settings.get('torgeternity', 'autoApplyDestinyCard') &&
      applyAutomation) {

      // Some don't require a previous chat card
      if (special === 'secondWind') {
        const actor = game.actors.get(actorId);
        if (!actor) return;
        const shock = actor.system.shock?.value;
        if (!shock) {
          return ChatMessage.implementation.create({
            content: _loc('torgeternity.destinyCard.notify.secondWindNoShock', { name: actor.name })
          });
        }
        const recovery = Math.min(shock, 5);
        await actor.update({ 'system.shock.value': shock - recovery });
        let extra = '';
        if (actor.hasStatusEffect('unconscious')) {
          extra = _loc('torgeternity.destinyCard.notify.secondWindNotKO');
          actor.toggleStatusEffect('unconscious', { active: false });
        }

        return ChatMessage.implementation.create({
          content: _loc('torgeternity.destinyCard.notify.secondWindRecovery', {
            name: actor.name,
            shock: recovery,
            extra,
          })
        });
      }

      // Reverse search through messages for first owned message
      const actorUuid = `Actor.${actorId}`;
      const chatMessage = game.messages.contents.findLast(msg => msg.type === 'action' && msg.system?.actor === actorUuid);
      if (!chatMessage) return;
      const test = chatMessage.system;
      if (!test) return ui.notifications.info('torgeternity.destinyCard.notify.noTestAvailable', { localize: true });

      switch (special) {
        case 'plus3':  // TorgeternityChatLog#onPlus3
        case 'plus3physical':
        case 'plus3mental':
          switch (special) {
            case 'plus3physical':
              if (test.plus3type && test.plus3type !== 'physical')
                return ui.notifications.info('torgeternity.destinyCard.notify.plus3notPhysical', { localize: true });
              break;
            case 'plus3mental':
              if (test.plus3type && test.plus3type !== 'mental')
                return ui.notifications.info('torgeternity.destinyCard.notify.plus3notMental', { localize: true });
              break;
          }
          // Check for MENTAL or PHYSICAL (test.attribute)
          if (test.skillRollMenuStyle === 'hidden')
            return ui.notifications.info('torgeternity.destinyCard.notify.noLongerModifyActionTotal', { localize: true })
          return TorgeternityChatLog.doPlus3(test, chatMessage);

        case 'plus3other':
          console.debug(`Destiny card '${special}' not automated yet`)
          break;

        case 'hero': // TorgeternityChatLog#onHero
          if (test.skillRollMenuStyle === 'hidden')
            return ui.notifications.info('torgeternity.destinyCard.notify.noLongerModifyActionTotal', { localize: true });
          if (test.heroTotal || test.skillRollMenuStyle === 'hidden')
            return ui.notifications.info('torgeternity.destinyCard.notify.alreadyPlayedHero', { localize: true });
          return TorgeternityChatLog.doHero(test, chatMessage);

        case 'drama': // TorgeternityChatLog#onDrama
          if (test.skillRollMenuStyle === 'hidden')
            return ui.notifications.info('torgeternity.destinyCard.notify.noLongerModifyActionTotal', { localize: true });
          if (test.dramaTotal || test.skillRollMenuStyle === 'hidden')
            return ui.notifications.info('torgeternity.destinyCard.notify.alreadyPlayedDrama', { localize: true });
          return TorgeternityChatLog.doDrama(test, chatMessage);

        case 'bd': // TorgeternityChatLog#onBd
          {
            if (test.targets.length > 1)
              return ui.notifications.info('torgeternity.destinyCard.notify.tooManyTargets', { localize: true });
            const target = test.targets[0];
            if (target.showBD === false)
              return ui.notifications.info('torgeternity.destinyCard.notify.tooLateForBD', { localize: true });
            return TorgeternityChatLog.doBd(test, chatMessage, target);
          }

        case 'secondWind': // already handled
          break;

        case 'seizeInitiative':
          // PROMPT: keep drama card for another round, or draw a new drama card immediately
          console.debug(`Destiny card '${special}' not automated yet`)
          break;

        default:
          console.debug(`Destiny card '${special}' unknown`)
          break;
      }
    }
  }
}