import { renderSkillChat } from './torgchecks.js';
import { rollBonusDie } from './torgchecks.js';
import { torgDamage } from './torgchecks.js';
import { TestResult, soakDamages } from './torgchecks.js';
import { TestDialog } from './test-dialog.js';
import TorgeternityActor from './documents/actor/torgeternityActor.js';

const { DialogV2 } = foundry.applications.api;

const BDMARKER = `\u00b2`;

export default class TorgeternityChatLog extends foundry.applications.sidebar.tabs.ChatLog {

  static DEFAULT_OPTIONS = {
    actions: {
      'openSheet': TorgeternityChatLog.#openSheet,
      'rollFav': TorgeternityChatLog.#onFavored,
      'rollPossibility': TorgeternityChatLog.#onPossibility,
      'rollUp': TorgeternityChatLog.#onUp,
      'rollHero': TorgeternityChatLog.#onHero,
      'rollDrama': TorgeternityChatLog.#onDrama,
      'addPlus3': TorgeternityChatLog.#onPlus3,
      'addBd': TorgeternityChatLog.#onBd,
      'modifierLabel': TorgeternityChatLog.#onModifier,
      'applyDam': TorgeternityChatLog.#applyDamage,
      'soakDam': TorgeternityChatLog.#soakDamage,
      'applySoak': TorgeternityChatLog.#applySoak,
      'applyEffects': TorgeternityChatLog.#applyEffects,
      'applyItemEffect': TorgeternityChatLog.#applyItemEffect,
      'applyStymied': TorgeternityChatLog.#applyStymied,
      'applyVulnerable': TorgeternityChatLog.#applyTargetVulnerable,
      'applyActorVulnerable': TorgeternityChatLog.#applyActorVulnerable,
      'backlash1': TorgeternityChatLog.#applyBacklash1,
      'backlash2': TorgeternityChatLog.#applyBacklash2,
      'backlash3': TorgeternityChatLog.#applyBacklash3,
      'testDefeat': TorgeternityChatLog.#testDefeat,
      'testConcentration': TorgeternityChatLog.#testConcentration,
      'applyDefeat': TorgeternityChatLog.#applyDefeat,
      'drawDestiny': TorgeternityChatLog.#drawDestiny,
      'pingTarget': TorgeternityChatLog.#pingTarget,
      "panToTarget": TorgeternityChatLog.#panToTarget,
    }
  }

  parentDeleteByTime(oldMsg) {
    // Use time and author to find all messages related to the same test.
    const messageIds = game.messages
      .filter(msg => msg.author === oldMsg.author && Math.abs(msg.timestamp - oldMsg.timestamp) < 500)
      .map(msg => msg.id);
    if (!messageIds.length) {
      console.warn('Failed to find any messages to delete for ', oldMsg);
      return;
    }
    ChatMessage.implementation.deleteDocuments(messageIds);
  }

  static async #onFavored(event, button) {
    event.preventDefault();
    const { chatMessageId, chatMessage, test } = getMessage(button);
    if (!chatMessage.isAuthor && !game.user.isGM) {
      return;
    }

    // reRoll because favored
    test.hideFavButton = true;

    const diceroll = await new Roll('1d20x10x20').evaluate();
    test.diceroll = diceroll;
    test.rollTotal = Math.max(test.diceroll.total, 1.1);
    test.isFav = false;

    this.parentDeleteByTime(chatMessage);
    return renderSkillChat(test);
  }

  async #chooseCosm(actor) {
    let content = '';
    let checked = true;
    const cosmposs = actor.flags?.torgeternity?.possibilityByCosm;
    for (const key of Object.keys(cosmposs || {})) {
      if (key === "coreEarthPoss" || !cosmposs[key]) continue;
      const label = game.i18n.localize(`torgeternity.cosms.${key.slice(0, -4)}`);
      content += `<p><label><input type="radio" name="choice" value="${key}" ${checked && "checked"}>${label} (${cosmposs[key]})</label>`;
      checked = false;
    }
    for (const shard of actor.itemTypes.eternityshard) {
      if (shard.system.possibilities.value === 0) continue;
      const count = `${shard.system.possibilities.value}/${shard.system.possibilities.max}`;
      content += `<p><label><input type="radio" name="choice" value="${shard.id}" ${checked && "checked"}>${shard.name} (${count})</label>`;
      checked = false;
    }
    if (!content) return null;

    // Maybe no minimum 10?
    content += `<hr><p><label><input type="checkbox" name="noMin10">${game.i18n.localize('torgeternity.chatText.possibilityNoMin10')}</label>`

    return await foundry.applications.api.DialogV2.wait({
      window: { title: "torgeternity.chatText.possibilityChoiceTitle" },
      position: { width: "auto" },
      classes: ["torgeternity"],
      content: content,
      buttons: [
        {
          action: "ok",
          label: "torgeternity.chatText.possibilityChoiceCosm",
          icon: "fa-solid fa-check",
          default: true,
          callback: (event, button, dialog) => {
            const choice = button.form.elements.choice;
            if (actor.items.has(choice.value))
              return {
                shard: choice.value,
                noMin10: button.form.elements.noMin10.checked
              }
            else
              return {
                cosmId: choice.value,
                noMin10: button.form.elements.noMin10.checked
              }
          }
        },
        {
          action: "cancel",
          label: "torgeternity.chatText.possibilityChoiceStandard",
          //icon: "fa-solid fa-check",
          callback: (event, button, dialog) => null
        },
      ]
    })
  }

  static async #pingTarget(event, button) {
    const { testTarget } = getChatTarget(button);
    const token = fromUuidSync(testTarget.uuid)?.object;
    if (!token || !canvas.ready) return;
    return canvas.ping(token.center, {});
  }

  static async #panToTarget(event, button) {
    const { testTarget } = getChatTarget(button);
    const token = fromUuidSync(testTarget.uuid)?.object;
    if (!token || !canvas.ready || !token.visible) return;
    // Foundry: _onPanToCombatant
    const { x, y } = token.center;
    return canvas.animatePan({ x, y, scale: Math.max(canvas.stage.scale.x, canvas.dimensions.scale.default) });
  }

  /// @type {TorgeternityChatLog} this
  static async #onPossibility(event, button) {
    event.preventDefault();
    const { chatMessageId, chatMessage, test } = getMessage(button);
    if (!chatMessage.isAuthor && !game.user.isGM) {
      return;
    }
    // check for actor possibility
    // If vehicle roll, search for a character from the user (operator or gunner)
    let possShard;
    let possCosm;
    let possPool;
    let noMin10 = event.shiftKey;
    const possOwner = test.actorType === 'vehicle' ? TorgeternityActor.getControlledActor() : fromUuidSync(test.actor);
    // If no valid possOwner, take possibilities from the GM
    if (!possOwner) {
      possPool = game.user.isGM ? parseInt(game.user.flags.torgeternity.GMpossibilities) : 0;
    } else {
      // Prompt for which possibilities to use
      const possChoice = event.ctrlKey && await this.#chooseCosm(possOwner);
      if (possChoice) {
        noMin10 = possChoice.noMin10;
        if (possChoice.shard) {
          possShard = possOwner.items.get(possChoice.shard);
          possPool = possShard.system.possibilities.value;
        } else {
          possCosm = possChoice.cosmId;
          possPool = possOwner.flags.torgeternity.possibilityByCosm[possCosm]
        }
      } else {
        possPool = possOwner.system?.other?.possibilities.value ?? 0;
      }
    }
    // 0 => if GM ask for confirm, or return message "no poss"
    if (possPool <= 0 && !game.user.isGM) {
      ui.notifications.warn(game.i18n.localize('torgeternity.sheetLabels.noPoss'));
      return;
    }

    if (test.chatNote) test.chatNote += '<br>';
    // 1=> pop up warning, confirm "spend last poss?"
    if (possPool === 1) {
      const confirm = await DialogV2.confirm({
        window: { title: 'torgeternity.sheetLabels.lastPoss' },
        content: game.i18n.localize('torgeternity.sheetLabels.lastPossMess'),
      });
      if (!confirm) return;
      test.chatNote += game.i18n.localize('torgeternity.sheetLabels.lastSpent');
    } // GM can grant an on the fly possibilty if he does the roll
    else if (possPool === 0 && game.user.isGM) {
      const confirm = await DialogV2.confirm({
        window: { title: 'torgeternity.sheetLabels.noPoss' },
        content: game.i18n.localize('torgeternity.sheetLabels.noPossFree'),
      });
      if (!confirm) return;
      possPool += 1;
      test.chatNote += game.i18n.localize('torgeternity.sheetLabels.freePoss');
    }
    if (!possOwner)
      game.user.isGM ? game.user.setFlag('torgeternity', 'GMpossibilities', possPool - 1) : {};
    else if (possShard)
      await possShard.update({ "system.possibilities.value": possPool - 1 });
    else if (possCosm)
      await possOwner.update({ [`flags.torgeternity.possibilityByCosm.${possCosm}`]: possPool - 1 });
    else
      await possOwner.update({ "system.other.possibilities.value": possPool - 1 });

    test.hideFavButton = true;

    // Roll for Possibility
    // possibilities is allowed 2 times (case in Nile Empire)
    if (test.possibilityTotal > 0) {
      test.possibilityStyle = 'disabled';
    } else {
      test.chatTitle += '*';
    }

    // check for Nile/Other/none cosm
    // if no, possibility style to grey
    const twoPossCosm = CONFIG.torgeternity.actionLawCosms;
    if (
      !(
        twoPossCosm.includes(canvas.scene.torg.cosm) ||
        twoPossCosm.includes(canvas.scene.torg.cosm2) ||
        canvas.scene.torg.cosm === 'none' ||
        canvas.scene.torg.cosm === undefined
      )
    ) {
      test.possibilityStyle = 'disabled';
    }

    const diceroll = await new Roll('1d20x10x20').evaluate();
    if (test.disfavored) {
      test.possibilityTotal = 0.1;
      test.disfavored = false;
      test.chatNote += game.i18n.localize('torgeternity.sheetLabels.explosionCancelled');
    } else if (!noMin10) {
      // Standardly, a possibility has a minimum of 10 on the dice.
      // Certain circumstances break that rule, so holding SHIFT will not apply min 10.
      // Rolling a Possibility a second roll takes the BETTER of the two results (Nile Empire)
      test.possibilityTotal = Math.max(10, diceroll.total, test.possibilityTotal);
    }
    test.diceroll = diceroll;

    // add chat note "poss spent" - include name of COSM here (if not a standard possibility)
    if (test.chatNote && test.chatNote.at[-1] !== '>') test.chatNote += ' ';
    if (possShard)
      test.chatNote = possShard.name + ' ';
    else if (possCosm)
      test.chatNote += game.i18n.localize(`torgeternity.cosms.${possCosm.slice(0, -4)}`) + ' ';
    test.chatNote += game.i18n.localize('torgeternity.sheetLabels.possSpent');
    if (noMin10) test.chatNote += game.i18n.localize('torgeternity.sheetLabels.noMin10');

    this.parentDeleteByTime(chatMessage);
    return renderSkillChat(test);
  }

  static async #onUp(event, button) {
    event.preventDefault();
    const { chatMessage, test } = getMessage(button);
    if (!chatMessage.isAuthor && !game.user.isGM) {
      return;
    }
    test.hideFavButton = true;

    // Roll for Up
    const diceroll = await new Roll('1d20x10x20').evaluate();
    if (test.disfavored) {
      test.upTotal = 0.1;
      test.disfavored = false;
      test.chatNote += game.i18n.localize('torgeternity.sheetLabels.explosionCancelled');
    } else {
      test.upTotal = diceroll.total;
    }
    test.diceroll = diceroll;

    test.chatTitle += '*';

    this.parentDeleteByTime(chatMessage);
    return renderSkillChat(test);
  }

  static async #onHero(event, button) {
    event.preventDefault();
    const { chatMessageId, chatMessage, test } = getMessage(button);
    if (!chatMessage.isAuthor && !game.user.isGM) {
      return;
    }
    test.hideFavButton = true;

    // Roll for Possibility
    const diceroll = await new Roll('1d20x10x20').evaluate();
    if (test.disfavored) {
      test.heroTotal = 0.1;
      test.disfavored = false;
      test.chatNote += game.i18n.localize('torgeternity.sheetLabels.explosionCancelled');
    } else if (diceroll.total < 10) {
      test.heroTotal = 10;
    } else {
      test.heroTotal = diceroll.total;
    }
    test.diceroll = diceroll;

    test.chatTitle += '*';

    this.parentDeleteByTime(chatMessage);
    return renderSkillChat(test);
  }

  static async #onDrama(event, button) {
    event.preventDefault();
    const { chatMessage, test } = getMessage(button);
    if (!chatMessage.isAuthor && !game.user.isGM) {
      return;
    }
    test.hideFavButton = true;

    // Increase cards played by 1
    const diceroll = await new Roll('1d20x10x20').evaluate();
    if (test.disfavored) {
      test.dramaTotal = 0.1;
      test.disfavored = false;
      test.chatNote += game.i18n.localize('torgeternity.sheetLabels.explosionCancelled');
    } else if (diceroll.total < 10) {
      test.dramaTotal = 10;
    } else {
      test.dramaTotal = diceroll.total;
    }
    test.diceroll = diceroll;

    test.chatTitle += '*';

    this.parentDeleteByTime(chatMessage);
    return renderSkillChat(test);
  }

  static async #onPlus3(event, button) {
    event.preventDefault();
    const { chatMessage, test } = getMessage(button);
    if (!chatMessage.isAuthor && !game.user.isGM) {
      return;
    }
    test.hideFavButton = true;

    // Add 1 to cards played
    test.cardsPlayed++;

    // Nullify Diceroll
    test.diceroll = null;

    this.parentDeleteByTime(chatMessage);
    return renderSkillChat(test);
  }

  /**
   * Adds a Bonus Die of damage to the target of this button
   * @param {} event 
   * @param {*} button 
   * @returns 
   */
  static async #onBd(event, button) {
    event.preventDefault();
    const rollTwice = event.shiftKey;
    const { chatMessageId, chatMessage, test, testTarget } = getChatTarget(button);
    if (!chatMessage.isAuthor && !game.user.isGM) {
      return;
    }

    // Pick the specific target from the chat card to receive the BD
    test.possibilityStyle = 'hidden';
    test.upStyle = 'hidden';
    test.dramaStyle = 'hidden';
    test.heroStyle = 'hidden';
    test.hideFavButton = true;
    test.hidePlus3 = true;

    let finalValue;
    if (rollTwice) {
      // How to show both rolls on chat card and DSN?
      const roll1 = await rollBonusDie(test.trademark);
      const roll2 = await rollBonusDie(test.trademark);
      finalValue = (roll1.value > roll2.value) ? roll1 : roll2;
      // if using DSN, we might fake rolling the dice for the lower result,
      // since the higher result will be rolled when the chat card is displayed.
    } else
      finalValue = await rollBonusDie(test.trademark);

    const newDamage = testTarget.damage + finalValue.total;

    testTarget.damage = newDamage;
    test.diceroll = finalValue;
    testTarget.amountBD += 1;
    testTarget.bdDamageSum += finalValue.total;
    game.messages.get(chatMessageId).delete();

    // No parentDeleteByTime?
    return renderSkillChat(test);
  }

  static async #onModifier(event, button) {
    event.preventDefault();
    const { chatMessage, test } = getMessage(button);
    if (!chatMessage.isAuthor && !game.user.isGM) {
      return;
    }
    test.mode = 'update';
    return TestDialog.wait(test);
  }

  /**
   * 
   * @param {*} event 
   * @param {*} button 
   * @returns 
   * 
   * @this 
   */
  static async #applyDamage(event, button) {
    event.preventDefault();
    if (event.shiftKey) return this.#adjustDamage(event);
    const { test, targetActor, testTarget } = getChatTarget(button);
    if (!targetActor || !testTarget) return;
    const damage = torgDamage(testTarget.damage, testTarget.targetAdjustedToughness,
      {
        attackTraits: test.attackTraits,
        defenseTraits: testTarget.defenseTraits,
        soakWounds: testTarget.soakWounds
      });
    targetActor.applyDamages(damage.shocks, damage.wounds);
    if (targetActor.isConcentrating) {
      this.promptConcentration(targetActor);
    }
  }

  static async #soakDamage(event, button) {
    event.preventDefault();
    const { targetActor, chatMessage } = getChatTarget(button);
    if (!targetActor) return;

    if (targetActor.id !== game.user?.character?.id && !game.user.isGM) {
      return;
    }
    if (targetActor.isDisconnected) {
      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: targetActor }),
        content: game.i18n.localize('torgeternity.chatText.check.cantUseRealityWhileDisconnected'),
      });
    }
    //
    let possPool = targetActor.system.other.possibilities.value;
    // 0 => if GM ask for confirm, or return message "no poss"
    if (possPool <= 0 && !game.user.isGM) {
      ui.notifications.warn(game.i18n.localize('torgeternity.sheetLabels.noPoss'));
      return;
    }

    // 1=> pop up warning, confirm "spend last poss?"
    if (possPool === 1) {
      const confirm = await DialogV2.confirm({
        window: { title: 'torgeternity.sheetLabels.lastPoss' },
        content: game.i18n.localize('torgeternity.sheetLabels.lastPossMess'),
      });
      if (!confirm) return;
    } // GM can grant an on the fly possibilty if he does the roll
    else if (possPool === 0 && game.user.isGM) {
      const confirm = await DialogV2.confirm({
        window: { title: 'torgeternity.sheetLabels.noPoss' },
        content: game.i18n.localize('torgeternity.sheetLabels.noPossFree'),
      });
      if (!confirm) return;
      ui.notifications.warn(game.i18n.localize('torgeternity.sheetLabels.possGrant'));
      possPool += 1;
    }

    await soakDamages(targetActor, chatMessage.id);
    await targetActor.update({ 'system.other.possibilities.value': possPool - 1 });
  }

  static #applySoak(event, button) {
    event.preventDefault();
    const { test: soaktest, chatMessage } = getMessage(button);
    const testTarget = soaktest.targetAll[0];

    const origMessageId = soaktest.soakingMessage;
    const origmsg = game.messages.get(origMessageId);
    // The message might no longer be available (after a restart? or after applying once already)
    if (!origmsg) return;

    // Update the original chat card to show the new damage.

    const origtest = origmsg.flags?.torgeternity?.test;
    const origtarget = origtest?.targetAll.find(target => target.dummyTarget || target.actorUuid === soaktest.actor);

    if (!origtest || !testTarget || !origtarget) {
      ui.notifications.warn(`APPLY SOAK: Failed to find original message`)
      return;
    }
    origtarget.soakWounds = testTarget.soakWounds;
    origtarget.showBD = false;
    origtest.diceroll = null;  // use existing roll number
    // Display soak information, WITHOUT the footnote about possibility spent
    origtarget.soakDescription = soaktest.chatNote.slice(0, -game.i18n.localize('torgeternity.sheetLabels.possSpent').length);

    // Hide "apply soak" button in the soak test (as well the buttons which affect the action total)
    chatMessage.update({
      "flags.torgeternity.test.showApplySoak": false,
      "flags.torgeternity.test.possibilityStyle": 'hidden',
      "flags.torgeternity.test.upStyle": 'hidden',
      "flags.torgeternity.test.heroStyle": 'hidden',
      "flags.torgeternity.test.dramaStyle": 'hidden',
      "flags.torgeternity.test.hideFavButton": true,
      "flags.torgeternity.test.hidePlus3": true,
    });

    if (origmsg.isOwner) {
      origmsg.delete();
      return renderSkillChat(origtest);
    } else {
      console.debug(`Sending SOAK request to GM`)
      game.socket.emit(`system.${game.system.id}`, {
        request: 'replaceTestCard',
        messageId: origMessageId,
        test: origtest
      })
    }
  }

  #adjustDamage(event) {  // context menu, not action
    // Prevent Foundry's normal contextmenu handler from doing anything
    event.preventDefault();
    event.stopImmediatePropagation();
    const { test, targetActor, testTarget } = getChatTarget(event.target);
    if (!targetActor || !testTarget) return;

    const newDamages = torgDamage(testTarget.damage, testTarget.targetAdjustedToughness,
      {
        attackTraits: test.attackTraits,
        defenseTraits: testTarget.defenseTraits,
        soakWounds: testTarget.soakWounds
      });

    const fields = foundry.applications.fields;
    const woundsGroup = fields.createFormGroup({
      label: game.i18n.localize('torgeternity.sheetLabels.modifyWounds'),
      input: fields.createNumberInput({ name: 'nw', value: newDamages.wounds, initial: 0 }),
    });

    const shockGroup = fields.createFormGroup({
      label: game.i18n.localize('torgeternity.sheetLabels.modifyShocks'),
      input: fields.createNumberInput({ name: 'ns', value: newDamages.shocks, initial: 0 }),
    })

    const content = `<p>${game.i18n.localize('torgeternity.sheetLabels.modifyDamage')}</p> <hr>
    ${woundsGroup.outerHTML}${shockGroup.outerHTML}`;

    DialogV2.wait({
      window: { title: 'torgeternity.sheetLabels.chooseDamage', },
      content,
      buttons: [
        {
          action: 'go',
          icon: 'fas fa-check',
          label: 'torgeternity.submit.apply',
          callback: async (event, button, dialog) => {
            const wounds = button.form.elements.nw.valueAsNumber;
            const shock = button.form.elements.ns.valueAsNumber;
            targetActor.applyDamages(shock, wounds);
          },
        },
      ],
      default: 'go',
    });
  }

  static async #applyEffects(event, button) {
    event.preventDefault();
    const { test, targetActor } = getChatTarget(button);
    if (!targetActor) return;

    // Transfer Effects from the Weapon (& Ammo) to the target.
    const effects = test.effects.map(uuid => {
      let obj = fromUuidSync(uuid, { strict: false });
      if (!obj) return undefined;
      let fx = obj.toObject();
      fx.disabled = false;
      return fx;
    }).filter(ef => ef !== undefined);

    if (effects.length)
      targetActor.createEmbeddedDocuments('ActiveEffect', effects);
  }

  static async #applyItemEffect(event, button) {
    event.preventDefault();
    const origEffect = fromUuidSync(button.dataset.uuid, { strict: false });
    if (!origEffect) return;
    const effect = origEffect.toObject();
    effect.disabled = false;
    for (const token of game.user.targets)
      token.document.actor.createEmbeddedDocuments('ActiveEffect', [effect]);
  }

  static async #applyStymied(event, button) {
    event.preventDefault();
    const { test, targetActor } = getChatTarget(button);
    if (targetActor) {
      await targetActor.applyStymiedState(test.actor);
      if (test.testType === 'interactionAttack' && targetActor.isConcentrating)
        this.promptConcentration(targetActor);
    }
  }

  static async #applyTargetVulnerable(event, button) {
    event.preventDefault();
    const { test, targetActor } = getChatTarget(button);
    if (targetActor) {
      await targetActor.applyVulnerableState(test.actor);
      if (test.testType === 'interactionAttack' && targetActor.isConcentrating)
        this.promptConcentration(targetActor);
    }
  }

  static async #applyActorVulnerable(event, button) {
    event.preventDefault();
    const { test, actor } = getChatActor(button);
    if (actor) actor.applyVulnerableState(test.actor);
  }

  /**
   * Inflict Backlash (2 shock)
   * @param event
   */
  static async #applyBacklash1(event, button) {
    event.preventDefault();
    const { actor } = getChatActor(button);
    if (actor) actor.applyDamages(/*shock*/ 2, /*wounds*/ 0);
  }

  /**
   * Inflict Minor Backlash (1 shock)
   * @param event
   */
  static async #applyBacklash2(event, button) {
    event.preventDefault();
    const { actor } = getChatActor(button);
    if (actor) actor.applyDamages(/*shock*/ 1, /*wounds*/ 0);
  }

  /**
   * Inflict Major Backlash (very stymied)
   * @param event
   */
  static async #applyBacklash3(event, button) {
    event.preventDefault();
    const { actor } = getChatActor(button);
    if (actor) actor.setVeryStymied();
  }

  static async #testDefeat(event, button) {
    event.preventDefault();
    // No test in the chat message that display Defeat prompt
    const { chatMessage } = getMessage(button);
    const attribute = button.dataset.control;
    const actor = game.actors.get(chatMessage.speaker.actor);

    return TestDialog.wait({
      DNDescriptor: 'standard',
      actor: actor,
      testType: 'attribute',
      skillName: attribute,
      skillValue: actor.system.attributes[attribute].value,
      isDefeatTest: true,
    });

    // Wait for manual addition of results, when applyDefeat is invoked.
  }

  /*
   * Concentration checks
   */

  promptConcentration(actor) {
    const hasAdds = actor.system.skills.willpower.adds;
    const skill = actor.system.skills.willpower;
    const attrib = actor.system.attributes.spirit;

    const html = `<p>${game.i18n.format('torgeternity.chatText.concentration.makeCheck', { actor: actor.name })}
    <div class="skill-roll-menu">
     <a class="button roll-button roll-defeat ${!hasAdds && 'notPreferred'}"
     data-actor-uuid="${actor.uuid}" data-action="testConcentration" data-test-type="skill", 
     data-skill-name="willpower" data-skill-adds="${skill.adds}" data-skill-value="${skill.value}" 
     data-is-fav="${skill.isFav}" data-unskilled-use="${skill.unskilledUse}">
     ${game.i18n.localize('torgeternity.skills.willpower')}
     </a>
     <a class="button roll-button roll-defeat ${hasAdds && 'notPreferred'}" 
     data-actor-uuid="${actor.uuid}" data-action="testConcentration" data-test-type="attribute", 
     data-skill-name="spirit" data-skill-adds="0" data-skill-value="${attrib.value}" 
     data-is-fav="${actor.system.attributes.spiritIsFav ?? 0}" data-unskilled-use="1">
     ${game.i18n.localize('torgeternity.attributes.spirit')}
     </a>
     </div>`;

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: html
    })
  }

  static async #testConcentration(event, button) {
    event.preventDefault();
    // No test in the chat message that display Defeat prompt
    const { chatMessage } = getMessage(button);
    const actor = game.actors.get(chatMessage.speaker.actor);

    // Convert strings to the correct type(s)
    const test = {
      DNDescriptor: 'standard',
      actor,
      ...button.dataset
    };
    test.isFav = !!test.isFav;
    test.unskilledUse = !!test.unSkilledUse;
    test.skillValue = Number(test.skillValue);
    test.isConcentrationCheck = true;

    const result = await TestDialog.wait(test);

    if (result.flags.torgeternity.test.result < TestResult.STANDARD) {
      const failed = actor.effects.filter(ef => ef.statuses.has('concentrating'));
      const list = failed.map(ef => `<li>${fromUuidSync(ef.origin).name}</li>`);

      ChatMessage.create({
        speaker: chatMessage.speaker,
        content: `<p>${game.i18n.format('torgeternity.chatText.concentration.broken', { actor: actor.name })}</p><ul>${list}</ul>`
      })
      actor.deleteEmbeddedDocuments('ActiveEffect', failed.map(ef => ef.id));
    }
  }

  static async #drawDestiny(event, button) {
    let id = button.dataset.actor;
    if (id.startsWith('Actor.')) id = id.slice(6);
    let actor = game.actors.get(id);
    if (!actor) return;  // maybe warning message
    if (!actor.isOwner) return;  // not an owner of the actor receiving the card
    let hand = actor.getDefaultHand();
    if (!hand) return;  // maybe warning message
    return hand.drawDestiny();
  }

  static async #openSheet(event, button) {
    let id = button.dataset.actor;
    if (id.startsWith('Actor.')) id = id.slice(6);
    let actor = game.actors.get(id);
    if (!actor) return;  // maybe warning message
    if (!actor.isOwner) return;  // not an owner of the actor receiving the card
    actor.sheet.render({ force: true });
  }

  static async #applyDefeat(event, button) {
    const { actor } = getChatActor(button);
    if (!actor) return console.error(`applyDefeat: failed to find actor`)
    const result = parseInt(button.dataset.result);
    console.log(`applyDefeat`, result)

    if (result < TestResult.STANDARD) {
      actor.toggleStatusEffect('dead', { active: true, overlay: true });
      return;
    }

    if (result === TestResult.OUTSTANDING) {
      await actor.toggleStatusEffect('unconscious', { active: true, overlay: true });
      return;
    }

    const selection = await foundry.applications.api.DialogV2.prompt({
      window: {
        title: game.i18n.localize('torgeternity.defeat.chooseAttribute')
      },
      content: foundry.applications.fields.createSelectInput({
        options: Object.entries(CONFIG.torgeternity.attributeTypes).map(attr => { return { value: attr[0], label: attr[1] } }),
        localize: true,
        name: 'attrName'
      }).outerHTML,
      ok: {
        label: "Confirm Choice",
        callback: (event, button, dialog) => button.form.elements.attrName.value
      }
    });

    if (selection) {
      const localAttr = game.i18n.localize(CONFIG.torgeternity.attributeTypes[selection]);

      await actor.toggleStatusEffect('unconscious', { active: true, overlay: true });
      const attrfield = `system.attributes.${selection}.value`;
      if (result === TestResult.STANDARD) {
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          owner: actor,
          content: game.i18n.format('torgeternity.defeat.permInjury', { attribute: localAttr })
        })
        // Permanent: Reduce attribute directly
        return actor.update({
          [`system.attributes.${selection}.base`]: Math.max(1, actor.system.attributes[selection].base - 1)
        })

      } else {
        // Temporary: Add AE to reduce until cleared
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          owner: actor,
          content: game.i18n.format('torgeternity.defeat.tempInjury', { attribute: localAttr })
        })
        return actor?.createEmbeddedDocuments('ActiveEffect', [{
          name: `${game.i18n.localize('torgeternity.defeat.good.effectName')} (${localAttr})`,
          icon: 'icons/svg/downgrade.svg',
          changes: [
            {
              key: `system.attributes.${selection}.value`,
              value: -1,
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            }
          ],
        }]);
      }
    }
  }
}

/**
 * 
 * @param {HTMLElement} button 
 * @returns 
 */
function getMessage(button) {
  const chatMessageId = button.closest('.chat-message').dataset.messageId;
  const chatMessage = game.messages.get(chatMessageId);
  const test = chatMessage.flags.torgeternity?.test;
  return { chatMessageId, chatMessage, test };
}

/**
 * 
 * @param {HTMLElement} button The button pressed to initiate this action
 * @returns {Actor} The actor that initiated this chat message
 */
function getChatActor(button) {
  const msg = getMessage(button);
  const test = msg?.test;
  if (!test) return null;
  const actor = fromUuidSync(test.actor, { strict: false });
  if (actor) return { actor, ...msg };
  ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noTarget'));
  return null;
}

/**
 * 
 * @param {HTMLElement} button The button pressed to initiate this action
 * @returns {Actor} The Actor of the target token of this chat message.
 */
function getChatTarget(button) {
  const msg = getMessage(button);
  const test = msg?.test;
  if (!test) return null;
  const targetActor = fromUuidSync(button.closest('.skill-roll-target')?.dataset.tokenUuid, { strict: false })?.actor;
  const testTarget = test?.targetAll.find(target => target.dummyTarget || target.actorUuid === targetActor.uuid);
  if (testTarget) return { targetActor, testTarget, ...msg };
  ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noTarget'));
  return null;
}