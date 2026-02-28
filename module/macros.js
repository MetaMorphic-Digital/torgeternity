import { TestResult, renderSkillChat, torgDamage } from './torgchecks.js';
import { oneTestTarget, TestDialog } from './test-dialog.js';

const { DialogV2 } = foundry.applications.api;

/**
 *
 */
export class TorgeternityMacros {
  /**
   *
   */
  async clearStatusEffects() {
    try {
      const tokens = canvas.tokens.controlled;
      if (!game.user.isGM) {
        throw new Error(game.i18n.localize('torgeternity.macros.commonMacroOnlyByGM'));
      } else if (tokens.length === 0) {
        throw new Error(game.i18n.localize('torgeternity.macros.commonMacroNoTokensSelected'));
      }

      let chatOutput = `<p>${game.i18n.localize(
        'torgeternity.macros.clearStatusEffectsHeadline'
      )}</p><ul>`;

      for (const token of tokens) {
        const effects = token.actor.statuses;

        for (const effect of effects) {
          switch (effect) {
            case 'stymied':
            case 'veryStymied':
            case 'vulnerable':
            case 'veryVulnerable':
              await token.actor.toggleStatusEffect(effect, { active: false });
              chatOutput += `<li>${game.i18n.localize(
                'torgeternity.macros.clearStatusEffectsliftetFrom'
              )} ${token.actor.name} ${game.i18n.localize(
                'torgeternity.macros.clearStatusEffectsliftetStatusOf'
              )} ${game.i18n.localize('torgeternity.statusEffects.' + effect)}</li>`;
              break;
            default:
              continue;
          }
        }
      }

      if (!chatOutput.includes('<li>')) {
        chatOutput = game.i18n.localize('torgeternity.macros.clearStatusEffectsNothingFound');
      } else {
        chatOutput += '</ul>';
      }

      return ChatMessage.create({ content: chatOutput });
    } catch (e) {
      ui.notifications.error(e.message);
    }
  }

  /**
   *
   */
  async applyFatigue() {
    const tokens = canvas.tokens.controlled;

    if (tokens.length === 0) {
      ui.notifications.error(game.i18n.localize('torgeternity.macros.commonMacroNoTokensSelected'));
      return;
    }
    let chatOutput = `<h2>${game.i18n.localize(
      'torgeternity.sheetLabels.fatigue'
    )}!</h2><p>${game.i18n.localize('torgeternity.macros.fatigueMacroDealtDamage')}</p><ul>`;
    for (const token of tokens) {
      if (token === undefined) {
        throw new Error('Exception, token is undefined');
      }
      const actor = token.actor;

      if (actor.hasStatusEffect('unconscious')) {
        chatOutput += `<li>${token.actor.name} ${game.i18n.localize('torgeternity.macros.fatigueMacroCharAlreadyKO')}</li>`;
        continue;
      }

      const shockIncrease = actor.fatigue;
      const applyResult = token.actor.applyDamages(/*shock*/ shockIncrease, /*wounds*/ 0);

      chatOutput += `<li>${actor.name}: ${shockIncrease} ${game.i18n.localize('torgeternity.sheetLabels.shock')}`;
      if (applyResult.shockExceeded) {
        chatOutput += `<br><strong>${actor.name}${game.i18n.localize('torgeternity.macros.fatigueMacroCharKO')}</strong>`;
      }
      chatOutput += '</li>';
    }
    chatOutput += '</ul>';

    return ChatMessage.create({ content: chatOutput });
  }
  // #region Revive Shock
  /**
   *
   */
  async reviveShock() {

    const fields = foundry.applications.fields;
    const shockGroup = fields.createFormGroup({
      label: game.i18n.localize('torgeternity.macros.reviveMacroWindowLabel1'),
      input: fields.createNumberInput({ name: 'inputValue' }),
    });
    const checkGroup = fields.createFormGroup({
      label: game.i18n.localize('torgeternity.macros.reviveMacroWholeRevive'),
      input: fields.createCheckboxInput({ name: 'wholeRevive' }),
    });

    return DialogV2.wait({
      window: { title: 'torgeternity.macros.reviveMacroChatHeadline', },
      content: `${shockGroup.outerHTML}${checkGroup.outerHTML}`,
      buttons: [
        {
          action: 'execute',
          label: 'torgeternity.dialogWindow.buttons.execute',
          callback: game.torgeternity.macros._processReviveShock,
          default: true
        },
      ],
    });
  }

  /**
   *
   * @param html
   */
  async _processReviveShock(event, button, dialog) {
    try {
      const tokens = canvas.tokens.controlled;

      const formElement = dialog.element.querySelector('form');
      const formData = new foundry.applications.ux.FormDataExtended(formElement);
      const bolWholeRevive = formData.object.wholeRevive;
      const reviveAmount = parseInt(formData.object.inputValue);

      if (tokens.length === 0) {
        throw new Error(game.i18n.localize('torgeternity.macros.commonMacroNoTokensSelected'));
      } else if (bolWholeRevive === false && isNaN(reviveAmount)) {
        throw new Error(game.i18n.localize('torgeternity.macros.reviveMacroError1'));
      }

      let chatOutput = `<h2>${game.i18n.localize(
        'torgeternity.macros.reviveMacroChatHeadline'
      )}</h2><p>${game.i18n.localize('torgeternity.macros.reviveMacroFirst')}<p><ul>`;

      for (const token of tokens) {
        // Following block, if a token has a null-value in system.shock.value (happens, if a value is simply deleted by user to set it apperently to 0), set it to 0, but double check it!
        if (isNaN(token.actor.system.shock.value)) {
          await token.actor.update({ 'system.shock.value': 0 });
        }
        const targetShockValue = parseInt(token.actor.system.shock.value);
        if (isNaN(targetShockValue)) {
          throw new Error('Shock Value is NaN');
        }

        if (targetShockValue === 0) {
          chatOutput += `<li>${token.actor.name} ${game.i18n.localize('torgeternity.macros.reviveMacroAlreadyFull')}</li>`;
          continue;
        }

        if (bolWholeRevive) {
          await token.actor.update({ 'system.shock.value': 0 });
          chatOutput += `<li>${token.actor.name} ${game.i18n.localize('torgeternity.macros.reviveMacroCharRevived')}`;
        } else {
          const newShockValue = parseInt(targetShockValue) - reviveAmount;
          await token.actor.update({ 'system.shock.value': newShockValue });
          chatOutput += `<li>${token.actor.name} ${game.i18n.localize('torgeternity.macros.reviveMacroCharPartyRevived')}${reviveAmount}`;
        }

        if (token.document.hasStatusEffect('unconscious')) {
          token.actor.toggleStatusEffect('unconscious', { active: false });
          chatOutput += `<br>${game.i18n.localize('torgeternity.macros.reviveMacroCharDeKOed')} ${token.actor.name}`;
        }
        chatOutput += '</li>';
      }
      chatOutput += '</ul>';

      return ChatMessage.create({ content: chatOutput });
    } catch (e) {
      ui.notifications.error(e.message);
    }
  }
  // #endregion
  // #region Roll BDs
  /**
   *
   */
  async rollBDs() {

    const fields = foundry.applications.fields;
    const inputGroup = fields.createFormGroup({
      label: game.i18n.localize('torgeternity.macros.bonusDieMacroContent'),
      input: fields.createNumberInput({ name: 'inputValue' }),
    });

    DialogV2.wait({
      window: { title: 'torgeternity.macros.bonusDieMacroTitle', },
      content: inputGroup.outerHTML,
      buttons: [
        {
          action: 'buttonRoll`',
          label: game.i18n.localize('torgeternity.sheetLabels.roll') + '!',
          callback: game.torgeternity.macros._rollItBDs,
          default: true
        },
      ],
    });
  }

  /**
   *
   * @param html
   */
  async _rollItBDs(event, button, dialog) {
    try {
      const formElement = dialog.element.querySelector('form');
      const formData = new foundry.applications.ux.FormDataExtended(formElement);
      const diceAmount = parseInt(formData.object.inputValue);

      if (isNaN(diceAmount)) {
        ui.notifications.error(game.i18n.localize('torgeternity.macros.commonMacroNoValue'));
        return;
      }

      const diceroll = await new Roll(`${diceAmount}d6x6max5`).evaluate();

      let chatOutput = `<p>${game.i18n.localize('torgeternity.macros.bonusDieMacroResult1')} 
      ${diceAmount} ${game.i18n.localize('torgeternity.chatText.bonusDice')} 
      ${game.i18n.localize('torgeternity.macros.bonusDieMacroResult2')} ${diceroll.total}.</p>`;

      if (game.user.targets.size === 0) {
        chatOutput += `<p>${game.i18n.localize('torgeternity.macros.bonusDieMacroNoTokenTargeted')}</p>`;
        console.log('No targets, creating chat Message, leaving Macro.');
        return ChatMessage.create({ content: chatOutput });
      }

      chatOutput += `<ul>`;
      for (const token of game.user.targets) {
        const tokenDamage = torgDamage(diceroll.total, token.actor.defenses.toughness,
          { defenseTraits: token.actor.defenseTraits });
        chatOutput += `<li>${game.i18n.localize('torgeternity.macros.bonusDieMacroResult3')}  ${token.document.name} `;
        chatOutput += (tokenDamage.shocks > 0) ?
          `${game.i18n.localize('torgeternity.macros.bonusDieMacroResult4')} ${tokenDamage.label}` :
          game.i18n.localize('torgeternity.macros.bonusDieMacroResultNoDamage');
        chatOutput += `.</li>`;
      }
      chatOutput += '</ul>';

      return ChatMessage.create({ content: chatOutput });
    } catch (e) {
      ui.notifications.error(e.message);
    }
  }

  // Show next 1-3 drama cards to a selection of players (much of this code is stolen in others macros)
  async dramaVision() {
    if (!game.user.isGM) return;

    if (!game.combat?.round) {
      return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noFight'));
    }

    const users = game.users.filter(user => user.active && !user.isGM);
    if (!users.length) {
      return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noPlayers'));
    }

    let checkOptions = '';
    const playerTokenIds = users.map(user => user.character?.id).filter(id => id !== undefined);
    const selectedPlayerIds = canvas.tokens.controlled.map(token => {
      if (playerTokenIds.includes(token.actor.id)) return token.actor.id;
    });


    // Build checkbox list for all active players
    const fields = foundry.applications.fields;
    users.forEach(user => {
      const checkbox =
        fields.createFormGroup({
          label: user.name,
          input: fields.createCheckboxInput({
            name: user.id,
            //value: user.name,
            value: user.character && selectedPlayerIds.includes(user.character.id)
          })
        });
      checkOptions += `<br>${checkbox.outerHTML}`;
    });

    // Choose the nb of cards to show
    const numCards = await DialogV2.wait({
      window: { title: 'torgeternity.dialogWindow.showingDramaCards.nbCards', },
      content: game.i18n.localize('torgeternity.dialogWindow.showingDramaCards.nbCardsValue'),
      buttons: [
        { action: "1", label: "1", },
        { action: "2", label: "2", },
        { action: "3", label: "3", },
      ],
    });

    const setting = game.settings.get('torgeternity', 'deckSetting');
    // Find the Drama Deck
    const dramaDeck = game.cards.get(setting.dramaDeck);
    // Find ?? the index of the Active Drama Card in the Drama Deck
    const activeDeck = game.cards.get(setting.dramaActive);
    if (!dramaDeck || !activeDeck) return;
    const cardSort = (activeDeck.cards.size === 0) ? dramaDeck.size :
      dramaDeck.cards.get(activeDeck._source.cards[0]._id).sort + 1;

    return DialogV2.wait({
      window: { title: 'torgeternity.dialogWindow.showingDramaCards.recipient', },
      content: `${game.i18n.localize('torgeternity.dialogWindow.showingDramaCards.whisper')} ${checkOptions} <br>`,
      buttons: [
        {
          action: "whisper",
          label: 'torgeternity.dialogWindow.showingDramaCards.apply',
          callback: (event, button, dialog) => {
            const targets = [];
            // build list of selected players ids for whispers target
            for (const user of users) {
              if (button.form.elements[user.id].checked) {
                targets.push(user.id);
              }
            }
            if (!targets.length) return;
            let chatOutput = {
              whisper: targets,
              content: `<div class="card-draw flexcol">${game.i18n.localize('torgeternity.dialogWindow.showingDramaCards.show')}`
            };
            for (let j = 0; j < numCards; j++) {
              const card = dramaDeck.cards.find(card => card.sort === cardSort + j);
              if (!card) {
                ui.notifications.warn(game.i18n.localize('torgeternity.dialogWindow.showingDramaCards.noMoreCards'));
                break;;
              }
              chatOutput.content +=
                `<div class="card-draw flexrow">
                <span class="card-chat-tooltip"><img class="card-face" src="${card.img}"/>
                <span><img src="${card.img}"></span></span>
                <span class="card-name">${card.name}</span>
                </div>`;
            };
            chatOutput.content += `</div>`;
            return ChatMessage.create(chatOutput);
          }
        }
      ],
    });
  }

  async dramaFlashback() {
    if (!game.combat?.round) {
      return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noFight'));
    }
    game.combat?.restorePreviousDrama();
  }

  // #endregion
  /**
   *
   */
  async reconnection() {
    const _token = canvas.tokens.controlled[0];
    const _actor = _token?.actor;

    if (!_actor) {
      ui.notifications.error(game.i18n.localize('torgeternity.macros.commonMacroNoTokensSelected'));
      return;
    }
    const realitySkill = _actor.system.skills.reality;

    if (!_token.document.hasStatusEffect('disconnected')) {
      ui.notifications.error(game.i18n.localize('torgeternity.macros.bonusDieMacroNoDiscon'));
      return;
    }

    const difficultyRecon = {
      pure: -8,
      dominant: -4,
      mixed: 0,
    };

    const test = {
      actor: _actor,
      skillName: 'reality',
      testType: 'reconnect',
      skillAdds: realitySkill.adds,
      skillValue: realitySkill.value,
      isFav: realitySkill.isFav,
      DNDescriptor: 'standard',
      unskilledUse: realitySkill.unskilledUse,
      woundModifier: -_actor.system.wounds.value,
      stymiedModifier: _actor.statusModifiers.stymied,
      vulnerableModifier: _actor.statusModifiers.vulnerable,
      waitingModifier: _actor.statusModifiers.waiting,
      type: 'skill',
      isOther1: game.scenes.active && game.scenes.active.torg.cosm !== 'none',
      other1Description: game.i18n.localize('torgeternity.macros.reconnectMacroZoneModifier'),
      other1Modifier: game.scenes.active && difficultyRecon[game.scenes.active.flags.torgeternity.zone],
    };

    if (!test.isOther1) {
      await DialogV2.prompt({
        window: { title: 'torgeternity.macros.reconnectMacroZoneModifierNotDetectedTitle' },
        content: `<p>${game.i18n.localize('torgeternity.macros.reconnectMacroZoneModifierNotDetected')}</p>`,
      });
    }

    return TestDialog.wait(test, { useTargets: false });
  }

  async openPacks() {
    for (const pack of game.packs) {
      if (pack.value?.metadata.packageName === 'torgeternity') {
        continue;
      }
      await pack.configure({ locked: false });
      const uuids = pack.index.map(pack => pack.uuid);

      for (const uuid of uuids) {
        const doc = await fromUuid(uuid);
        const data = doc.toObject();
        await doc.delete();
        console.warn('Deleted', doc.name);
        await doc.constructor.create(data, { keepId: true, pack: pack.collection });
        console.warn('Recreated', doc.name);
      }
      await pack.configure({ locked: true });
    }
    ui.notifications.info('Migration complete!');
  }

  /**
   *
   */
  async deleteAllHands() {
    for (const card of game.cards) {
      card.type === 'hand' ? await card.delete() : console.log('no hand');
    }
  }

  // If you need to cancel a card a player just played
  // works if the card to get back is the last message in ChatLog, and if player owns only one hand
  async playerPlayback() {
    if (!game.user.isGM) {
      return;
    }
    const users = game.users.filter(user => user.active && !user.isGM);
    if (!users.length) {
      return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noPlayers'));
    }
    let checkOptions = '';
    const playerTokenIds = users.map(user => user.character?.id).filter((id) => id !== undefined);
    const selectedPlayerIds = canvas.tokens.controlled.map((token) => {
      if (playerTokenIds.includes(token.actor.id)) return token.actor.id;
    });

    // Build checkbox list for all active players
    const fields = foundry.applications.fields;
    users.forEach((user) => {
      const checkbox =
        fields.createFormGroup({
          label: user.name,
          input: fields.createCheckboxInput({
            name: user.id,
            value: user.character && selectedPlayerIds.includes(user.character.id)
          })
        });
      checkOptions += `<br>${checkbox.outerHTML}`;
    });

    DialogV2.wait({
      window: { title: 'torgeternity.dialogWindow.cardRetour.cardBack', },
      content: `${game.i18n.localize('torgeternity.dialogWindow.cardRetour.cardOwner')} ${checkOptions} <br>`,
      buttons: [
        {
          action: 'whisper',
          label: 'torgeternity.dialogWindow.showingDramaCards.apply',
          callback: createMessage,
        },
      ],
    });

    function createMessage(event, button, dialog) {
      let target;
      // build list of selected players ids for whispers target
      for (const user of users) {
        if (button.form.elements[user.id].checked) {
          target = user;
        }
      }
      if (target) {
        const userid = target.id;
        const destinyDiscard = game.cards.get(game.settings.get('torgeternity', 'deckSetting').destinyDiscard);
        const lastCard = destinyDiscard?.cards.contents.pop();
        if (!lastCard) return;
        const parentHand = target.character.getDefaultHand();
        const found = game.messages.contents.filter(m => m.author.id === userid);
        if (!found.length) return;
        const lastMessage = found.pop();
        // don't use game.torgeternity.cardChatOptions, since no other messages put in chat
        lastCard.pass(parentHand);
        ChatMessage.implementation.deleteDocuments([lastMessage.id]);
      }
    }
  }

  // create effects related with your choice, Defense/specific Attribute/All attributes
  // if any value change (attribute or add or limitation) erase the effects and redo it
  async torgBuff() {
    if (game.canvas.tokens.controlled.length === 0 && !game.user.character) {
      ui.notifications.error(game.i18n.localize('torgeternity.notifications.noTokenNorActor'));
      return;
    }
    // Choose the attribute you want to modify
    const attr = await DialogV2.wait({
      window: { title: 'torgeternity.dialogWindow.buffMacro.choice', },
      content: game.i18n.localize('torgeternity.dialogWindow.buffMacro.choose'),
      buttons: [
        { action: 'mind', label: 'torgeternity.attributes.mind', },
        { action: 'strength', label: 'torgeternity.attributes.strength', },
        { action: 'charisma', label: 'torgeternity.attributes.charisma', },
        { action: 'spirit', label: 'torgeternity.attributes.spirit', },
        { action: 'dexterity', label: 'torgeternity.attributes.dexterity', },
        { action: 'all', label: 'torgeternity.dialogWindow.buffMacro.allAttributes', },
        { action: 'physicalDefense', label: 'torgeternity.dialogWindow.buffMacro.physicalDefenses', },
        { action: 'defense', label: 'torgeternity.sheetLabels.defenses', },
        { action: 'piety', label: 'torgeternity.sheetLabels.piety', },
        { action: 'cancel', label: 'torgeternity.dialogWindow.buffMacro.cancelEffects', },
      ],
    });
    // If nothing selected, abort
    if (!attr) return;

    if (attr === 'cancel') {
      ui.notifications.warn('MacroEffects removed');
      let tokens = game.canvas.tokens.controlled;
      if (!tokens.length) tokens = game.user.character.getActiveTokens();
      for (const token of tokens) {
        const delEffects = token.effects.filter((e) => e.name.includes('rd(s)') && e.name.includes(' / '));
        delEffects.forEach((e) => e.delete());
      }
      return;
    }

    // choose the bonus you expect
    const bonus = await DialogV2.wait({
      window: { title: 'torgeternity.dialogWindow.buffMacro.bonusTitle', },
      content: `<div>${game.i18n.localize(
        'torgeternity.dialogWindow.buffMacro.value'
      )} <input name="bonu" value=1 style="width:50px"/></div>`,
      buttons: [
        {
          action: '1',
          label: 'torgeternity.dialogWindow.showingDramaCards.apply',
          callback: (event, button, dialog) => parseInt(dialog.element.querySelector('[name=bonu]').value)
        },
      ],
    });

    // choose the duration of the effect
    const duration =
      (attr !== 'piety') ?
        await DialogV2.wait({
          window: { title: 'torgeternity.dialogWindow.buffMacro.timeLabel' },
          content: `<div>${game.i18n.localize('torgeternity.dialogWindow.buffMacro.time')} <input name="dur" value=1 style="width:50px"/></div>`,
          buttons: [
            {
              action: '1',
              label: game.i18n.localize('torgeternity.dialogWindow.showingDramaCards.apply'),
              callback: (event, button, dialog) => parseInt(dialog.element.querySelector('[name=dur]').value)
            },
          ],
        }) : 0;

    let newEffect = {};

    if (attr === 'defense') {
      // only Defenses, but ALL defenses
      newEffect = {
        name: `${game.i18n.localize('torgeternity.dialogWindow.buffMacro.defenses')} / ${bonus} / ${duration} rd(s)`,
        duration: { rounds: duration, turns: duration, expiry: 'turnEnd' },
        changes: [
          {
            key: 'defenses.dodge.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'defenses.meleeWeapons.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'defenses.unarmedCombat.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'defenses.intimidation.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'defenses.maneuver.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'defenses.taunt.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'defenses.trick.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
        ],
        disabled: false,
      };
      // Aspect modifications related to bonus/penalty
      newEffect.tint = bonus < 0 ? '#ff0000' : '#00ff00';
      newEffect.icon = bonus < 0 ? 'icons/svg/downgrade.svg' : 'icons/svg/upgrade.svg';
    } // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    else if (attr === 'physicalDefense') {
      // only physical Defenses
      newEffect = {
        name: `${game.i18n.localize('torgeternity.dialogWindow.buffMacro.physicalDefenses')} / ${bonus} / ${duration} rd(s)`,
        duration: { rounds: duration, turns: duration, expiry: 'turnEnd' },
        changes: [
          {
            key: 'defenses.dodge.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'defenses.meleeWeapons.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'defenses.unarmedCombat.mod',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
        ],
        disabled: false,
      };
      // Aspect modifications related to bonus/penalty
      newEffect.tint = bonus < 0 ? '#ff0000' : '#00ff00';
      newEffect.icon = bonus < 0 ? 'icons/svg/downgrade.svg' : 'icons/svg/upgrade.svg';
    } // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    else if (attr === 'all') {
      // preparation of attribute effect
      newEffect = {
        name: `${game.i18n.localize('torgeternity.dialogWindow.buffMacro.allAttributes')} / ${bonus} / ${duration} rd(s)`,
        duration: { rounds: duration, turns: duration, expiry: 'turnEnd' },
        changes: [
          {
            key: 'system.attributes.mind.value',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'system.attributes.spirit.value',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'system.attributes.strength.value',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'system.attributes.dexterity.value',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
          {
            key: 'system.attributes.charisma.value',
            value: bonus,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
        ],
        disabled: false,
      };
      // Aspect modifications related to bonus/penalty
      newEffect.tint = bonus < 0 ? '#ff0000' : '#00ff00';
      newEffect.icon = bonus < 0 ? 'icons/svg/downgrade.svg' : 'icons/svg/upgrade.svg';

    } else if (attr === 'piety') {
      let actors = game.canvas.tokens.controlled.map(t => t.actor);
      if (!actors.length) actors = [game.user.character];
      for (const actor of actors) {
        if (Object.hasOwn(actor.system.other, 'piety'))
          await actor.update({ 'system.other.piety': actor.system.other.piety + bonus });
      }
      return;

    } else {
      // One attribute
      // preparation of attribute effect
      newEffect = {
        name: `${game.i18n.localize('torgeternity.attributes.' + attr)} / ${bonus} / ${duration} rd(s)`,
        duration: { rounds: duration, turns: duration, expiry: 'turnEnd' },
        changes: [
          {
            key: 'system.attributes.' + attr + '.value',
            value: bonus,
            mode: 2,
          },
        ],
        disabled: false,
      };

      // Aspect modifications related to bonus/penalty
      newEffect.tint = bonus < 0 ? '#ff0000' : '#00ff00';
      newEffect.icon = bonus < 0 ? 'icons/svg/downgrade.svg' : 'icons/svg/upgrade.svg';
    }
    let actors = game.canvas.tokens.controlled.map(t => t.actor);
    if (!actors.length) actors = [game.user.character];

    for (const actor of actors) {
      await actor?.createEmbeddedDocuments('ActiveEffect', [newEffect]);
    }
  }

  /**
   * Applies damage on targeted tokens
   *
   * @param {string} source A description of the source the damage comes from
   * @param {number} value The actual damage value
   * @param {number} bds The number of Bonus Dice that ought to take place.
   * @param {boolean} armored Does armor count?
   * @param {number} ap The amount of armor piercing.
   * @returns {null} no Value
   */
  async periculum(source = '', value = 10, bds = 0, armored = false, ap = 0) {
    if (!game.user.targets.size)
      return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noTarget'));

    if (armored) armored = 'checked';

    // add options for AP and bypass the window

    const info = await DialogV2.prompt({
      window: { title: 'Periculum' },
      content: `
          < label > ${game.i18n.localize('torgeternity.macros.periculumSourceName')} <br>
            <input placeholder=${game.i18n.localize('torgeternity.macros.periculumSourcePlaceHolder')}
              style="color:black" name="source" type="string" value="${source}"></label>
            <label>${game.i18n.localize('torgeternity.macros.periculumDamageValue')}
              <input name="damageBase" type="number" value=${value} autofocus style="width:35px"></label>
            <label>${game.i18n.localize('torgeternity.macros.periculumBds')}
              <input name="plusBD" type="number" value=${bds} style="width:35px"></label>
            <label>${game.i18n.localize('torgeternity.macros.periculumArmor')}
              <input name="armor" type="checkbox" ${armored}></label>
            <label>${game.i18n.localize('torgeternity.macros.periculumAp')}
              <input name="ap" type="number" style="width:35px" value=${ap}></label>
            `,
      ok: {
        label: game.i18n.localize('torgeternity.dialogWindow.buttons.execute'), // 'Submit Effect',
        callback: (event, button, dialog) => [
          button.form.elements.source.value,
          button.form.elements.damageBase.valueAsNumber,
          button.form.elements.plusBD.value,
          button.form.elements.armor.checked,
          button.form.elements.ap.value,
        ],
      },
    });

    return renderSkillChat({
      testType: 'custom',
      actor: game.actors.contents[0].uuid,
      actorPic: 'systems/torgeternity/images/tokens/vulnerable.webp',
      actorName: 'Quid',
      actorType: 'threat',
      addBDs: parseInt(info[2]),
      amountBD: 0,
      isAttack: true,
      skillName: info[0],
      skillValue: 10,
      isFav: false,
      unskilledUse: true,
      damage: parseInt(info[1]),
      weaponAP: parseInt(info[4]),
      applyArmor: info[3],
      darknessModifier: 0,
      DNDescriptor: 'standard',
      type: 'attack',
      applySize: false,
      attackOptions: true,
      rollTotal: 11,
      chatNote: '',
      bdDamageSum: 0,
      hasModifiers: false,
      targetAll: Array.from(game.user.targets).map(token => oneTestTarget(token)),
      bonus: 0,
      possibilityStyle: 'hidden',
      coverModifier: 0,
      chatTitle: '',
      DN: 9,
      hideFavButton: true,
      unskilledTest: false,
      diceList: [10],
      combinedRollTotal: 10,
      modifiers: 0,
      modifierText: '',
      cardsPlayed: 0,
      rollResult: 11,
      outcome: '',
      actionTotalContent: '',
      resultText: '',
      resultTextStyle: 'display:none',
    });
  }
}
