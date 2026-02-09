import { TestDialog, TestDialogLabel, dummyTestTargets } from './test-dialog.js';
const { DialogV2 } = foundry.applications.api;

export const TestResult = {
  UNKNOWN: 0,
  MISHAP: 1,
  FAILURE: 2,
  STANDARD: 3,
  GOOD: 4,
  OUTSTANDING: 5
}

export const TestResultKey = { // with .main or .sub
  [TestResult.UNKNOWN]: '',
  [TestResult.MISHAP]: 'mishap',
  [TestResult.FAILURE]: 'failure',
  [TestResult.STANDARD]: 'standard',
  [TestResult.GOOD]: 'good',
  [TestResult.OUTSTANDING]: 'outstanding'
}

const SHADOW_STYLE = ';text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0px 0px 15px black;';

/**
 *
 * @param test
 */
export async function renderSkillChat(test) {

  if (CONFIG.debug.torgtestrender) console.debug('renderSkillChat', test);

  for (const key of Object.keys(test)) {
    if (!(test[key] instanceof String)) continue;
    const num = Number(test[key]);
    if (isNaN(num)) continue;
    console.error(`renderSkillChat passed a number as a String! (${key} = ${test[key]})`)
    test[key] = num;
  }

  // Check for targeting a vehicle which doesn't have an operator.
  for (const target of test.targetAll) {
    if (target.type === 'vehicle' && isNaN(target.defenses.dodge)) {
      ui.notifications.error(game.i18n.format('torgeternity.notifications.noVehicleOperator', { a: target.targetName }));
      return;
    }
  }

  // For non-targeted tests, ensure we iterate through the loop at least once
  if (!test.targetAll.length)
    test.targetAll = dummyTestTargets();

  test.torgDiceStyle = game.settings.get('torgeternity', 'useRenderedTorgDice');

  const testActor = fromUuidSync(test.actor);
  const testItem = test.itemId ? testActor.items.get(test.itemId) : null;

  // Handle ammo, if not opt-out. First, check if there is enough ammo, then reduce it.
  if (testItem?.weaponWithAmmo) {
    // Ammo used is based on the targets Modifier, not the number of selected tokens (to account for Blast weapons)
    // see parameters of hasSufficientAmmo in test-dialog.js
    await testItem.reduceAmmo(test.burstModifier, (1 - test.targetsModifier / 2));
    test.ammoCount = testItem.system.ammo.value;
  }

  const useHighestDN = game.settings.get('torgeternity', 'uniqueDN') ? await highestDN(test) : undefined;
  const singleResult = (useHighestDN || (!test.isAttack && test.targetAll[0].dummyTarget));

  let first = true;
  for (const target of test.targetAll) {
    test.sizeModifier = target.sizeModifier ?? 0;
    test.vulnerableModifier = target.vulnerableModifier ?? 0;
    test.darknessModifier = Math.min(0, (target.darknessModifier ?? 0) + (test.targetDarknessModifier ?? 0));

    //
    // Check to see if we already have a chat title from a chat card roll. If not, Set title for Chat Message in test.chatTitle //
    //
    if (!test.chatTitle) {
      test.chatTitle = TestDialogLabel(test);
    }

    //
    // Establish DN for this test based on test.DNDescriptor //
    //
    test.DN = useHighestDN ?? individualDN(test, target);

    //
    // -----------------------Determine Bonus---------------------------- //

    // Do we display the unskilled label for a Storm Knight?
    test.unskilledTest = (testActor.type === 'stormknight' &&
      test.testType !== 'custom' &&
      test.testType !== 'attribute' &&
      test.testType !== 'activeDefense' &&
      test.testType !== 'activeDefenseUpdate' &&
      !test.customSkill &&
      !testActor.system.skills[test.skillName].adds);

    // Generate roll, if needed
    if (test.rollTotal === 0 && !test.explicitBonus) {
      // Generate dice roll
      const dice = test.unskilledTest ? '1d20x10' : '1d20x10x20';

      test.diceroll = await new Roll(dice).evaluate();
      if (test.isFav && test.disfavored) {
        test.isFav = false;
        test.disfavored = false;
        test.chatNote += game.i18n.localize('torgeternity.sheetLabels.favDis');
      }
      if (!test.isFav) test.hideFavButton = true;
      if (test.disfavored) {
        // even if explosion occured, we keep first die
        test.rollTotal = test.diceroll.dice[0].results[0].result;
        if (test.diceroll.dice[0].results.length > 1) {
          // => explosion occured, so remove disfavored
          test.disfavored = false;
          test.chatNote += game.i18n.localize('torgeternity.sheetLabels.explosionCancelled');
        }
      } else test.rollTotal = test.diceroll.total;

      // Check for Disconnection
      if (!test.ignoreContradictions && testItem && test.rollTotal <= 4) {

        // We can't check for Starred Perks, since no dice rolls are made from them.
        const failsZone = testItem.isGeneralContradiction(game.scenes.current) || testItem.isContradiction(game.scenes.current?.torg.axioms);
        const failsActor = testItem.isContradiction(testActor.system.axioms);
        const limit = (!failsZone && !failsActor) ? 0 : (failsZone && failsActor) ? 4 : 1;

        if (test.rollTotal <= limit) {

          function axiomLabels(label, axiomField, failures) {
            if (!failures) return null;
            const result = []
            for (const failure of failures)
              result.push(game.i18n.format(`torgeternity.chatText.disconnection.${label}`, {
                axiom: game.i18n.localize(CONFIG.torgeternity.axioms[failure.axiom]),
                actorType: game.i18n.localize(CONFIG.Actor.typeLabels[testActor.type]),
                itemName: testItem.name,
                itemAxiom: failure.item,
                [axiomField]: failure.max
              }))
            return result;
          }

          test.disconnection = game.i18n.format('torgeternity.chatText.disconnection.base', {
            diceTotal: test.rollTotal,
            itemName: testItem.name,
          })
          test.disconnectionZone = axiomLabels('zoneLabel', 'zoneAxiom', failsZone);
          test.disconnectionActor = axiomLabels('actorLabel', 'actorAxiom', failsActor);

          if (game.settings.get('torgeternity', 'autoDisconnect'))
            testActor.toggleStatusEffect('disconnected', { active: true })
        }
      }
    }

    // Add the dices list in test (either from original roll above, or from extra BD roll)
    // add the dices only once, not for each target
    if (first && test.diceroll) {
      // to avoid errors if +3 cards
      const values = test.diceroll.dice[0].results.filter(r => r.active);
      if (test.diceroll.dice[0].method === 'manual' && game.settings.get('torgeternity', 'showManualRolls'))
        for (const value of values) value.manual = true;
      if (test.diceroll.dice[0]._faces === 6)
        test.bonusDiceList = test.bonusDiceList ? test.bonusDiceList.concat(values) : values;
      else
        test.diceList = test.diceList ? test.diceList.concat(values) : values;
    }

    //
    // Get current bonus and make + label visible if number is positive
    //
    // Initialize upTotal, possibilityTotal, heroTotal, and dramaTotal at zero, if necessary
    test.upTotal ??= 0;
    test.possibilityTotal ??= 0;
    test.heroTotal ??= 0;
    test.dramaTotal ??= 0;

    // Calculate combinedRollTotal
    if (!test.explicitBonus) {
      test.combinedRollTotal = test.rollTotal + test.upTotal + test.possibilityTotal + test.heroTotal + test.dramaTotal;
      test.bonus = torgBonus(test.combinedRollTotal);
      if (test.multiModifier) game.combat?.getCombatantsByActor(testActor)?.shift()?.setCurrentBonus(test.bonus);
      if (test.combinedRollTotal >= 60) test.possibleGlory = true;
    } else {
      test.rollTotal = undefined;
      test.combinedRollTotal ??= '-'; // Only set if undefined
    }

    // Raise bonus to 1 if actively defending
    if (test.testType === 'activeDefense' || test.testType === 'activeDefenseUpdate') {
      if (test.bonus < 1) test.bonus = 1;
    }

    function modifierString(label, value) {
      let result = game.i18n.localize(label);
      if (typeof value === 'number') result += ` (${value.signedString()})`
      return result;
    }

    // Set Modifiers and Chat Content Relating to Modifiers
    let modifiers = [];
    test.modifiers = 0;
    test.modifierText = '';
    if (test.testType === 'soak') {
      test.vulnerableModifier = 0;
      test.darknessModifier = 0;
    }

    if (test.woundModifier < 0) {
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.wounds', test.woundModifier));
      test.modifiers += test.woundModifier;
    }

    if (test.stymiedModifier < 0) {
      if (test.stymiedModifier === -2) {
        modifiers.push(modifierString('torgeternity.chatText.check.modifier.stymied', -2));
        test.modifiers += -2;
      } else if (test.stymiedModifier === -4) {
        modifiers.push(modifierString('torgeternity.chatText.check.modifier.veryStymied', -4));
        test.modifiers += -4;
      }
    }

    // Only apply concentration modifier if a relevant skill (or a concentration check)
    if (test.concentratingModifier < 0) {
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.concentrating', test.concentratingModifier));
      test.modifiers += test.concentratingModifier;
    }
    if (test.darknessModifier < 0) {
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.darkness', test.darknessModifier));
      test.modifiers += test.darknessModifier;
    }

    if (test.waitingModifier < 0) {
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.waiting', test.waitingModifier));
      test.modifiers += test.waitingModifier;
    }

    if (test.movementModifier < 0) {
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.running', test.movementModifier));
      test.modifiers += -2;
    }

    if (test.multiModifier < 0) {
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.multiAction', test.multiModifier));
      test.modifiers += test.multiModifier;
    }

    if (test.targetsModifier < 0) {
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.multiTarget', test.targetsModifier));
      test.modifiers += test.targetsModifier;
    }

    if (test.isOther1) {
      modifiers.push(modifierString(test.other1Description, test.other1Modifier));
      test.modifiers += test.other1Modifier;
    }

    if (test.isOther2) {
      modifiers.push(modifierString(test.other2Description, test.other2Modifier));
      test.modifiers += test.other2Modifier;
    }

    if (test.isOther3) {
      modifiers.push(modifierString(test.other3Description, test.other3Modifier));
      test.modifiers += test.other3Modifier;
    }

    // Apply target-related modifiers
    if (!target.dummyTarget) {
      // Apply the size modifier in appropriate circumstances
      if (test.applySize && test.sizeModifier) {
        test.modifiers += test.sizeModifier;
        modifiers.push(modifierString('torgeternity.chatText.check.modifier.targetSize', test.sizeModifier));
      }

      // Apply target vulnerability modifier
      if (test.vulnerableModifier === 2) {
        test.modifiers += test.vulnerableModifier;
        modifiers.push(modifierString('torgeternity.chatText.check.modifier.targetVulnerable', test.vulnerableModifier));
      } else if (test.vulnerableModifier === 4) {
        test.modifiers += test.vulnerableModifier;
        modifiers.push(modifierString('torgeternity.chatText.check.modifier.targetVeryVulnerable', test.vulnerableModifier));
      }
    }

    if (test.calledShotModifier) {
      test.modifiers += test.calledShotModifier;
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.calledShot', test.calledShotModifier));
    }

    if (test.burstModifier) {
      test.modifiers += test.burstModifier;
      if (test.burstModifier === 2) {
        modifiers.push(modifierString('torgeternity.chatText.check.modifier.shortBurst', test.burstModifier));
      } else if (test.burstModifier === 4) {
        modifiers.push(modifierString('torgeternity.chatText.check.modifier.longBurst', test.burstModifier));
      } else if (test.burstModifier === 6) {
        modifiers.push(modifierString('torgeternity.chatText.check.modifier.heavyBurst', test.burstModifier));
      }
    }

    if (test.allOutFlag) {
      test.modifiers += 4;
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.allOutAttack', 4));

      // if it's an all-out-attack, apply very vulnerable to attacker
      // duration = 2 since it is testActor's current turn, and the duration decreases at the END of each turn
      if (first) await testActor.setVeryVulnerable(testActor.uuid, 2);
    }

    if (test.aimedFlag) {
      test.modifiers += 4;
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.aimedShot', 4));
    }

    if (test.blindFireFlag) {
      test.modifiers += -6;
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.blindFire', -6));
    }

    if (test.concealmentModifier) {
      test.modifiers += test.concealmentModifier;
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.targetConcealment', test.concealmentModifier));
    }

    if (test.testType === 'power' && test.powerModifier) {
      test.modifiers += test.powerModifier;
      modifiers.push(modifierString('torgeternity.chatText.check.modifier.powerModifier', test.powerModifier));
    }

    // Apply vehicle-related modifiers
    if (test.testType === 'chase' || test.testType === 'stunt' || test.testType === 'vehicleBase') {
      if (test.maneuverModifier) {
        test.modifiers += test.maneuverModifier;
        modifiers.push(modifierString('torgeternity.stats.maneuverModifier', test.maneuverModifier));
      }
    }

    if (test.testType === 'chase' && test.speedModifier) {
      test.modifiers += test.speedModifier;
      modifiers.push(modifierString('torgeternity.stats.speedModifier', test.speedModifier));
    }

    if (modifiers.length) {
      test.modifierText = `<p>${modifiers.sort().join('<br>')}</p>`;
    }

    // Add +3 cards to bonus
    // Initialize cardsPlayed if null
    test.cardsPlayed ??= 0;
    test.bonus += test.cardsPlayed * 3;

    test.rollResult = test.skillValue + test.bonus + test.modifiers;

    // Determine Outcome
    const testDifference = test.rollResult - test.DN;

    // Handle numeric value in DNDescriptor
    let actionTotalContent = `${game.i18n.localize('torgeternity.chatText.check.result.actionTotal')} ${test.rollResult} vs. ${test.DN} `;
    if (isNaN(Number(test.DNDescriptor))) actionTotalContent += game.i18n.localize('torgeternity.dnTypes.' + test.DNDescriptor);
    if (singleResult)
      test.actionTotalContent = actionTotalContent;
    else
      target.actionTotalContent = actionTotalContent;

    const useColorBlind = game.settings.get('torgeternity', 'useColorBlindnessColors');
    if (testDifference < 0) {
      test.outcome = game.i18n.localize('torgeternity.chatText.check.result.failure');
      test.result = TestResult.FAILURE;
      if (test.testType === 'power') {
        test.showBacklashButtons = true;
      }
      test.outcomeColor = 'color: red';
      if (test.testType === 'soak') target.soakWounds = 0;
    } else if (testDifference > 9) {
      test.outcome = game.i18n.localize('torgeternity.chatText.check.result.outstandingSuccess');
      test.result = TestResult.OUTSTANDING;
      test.outcomeColor = useColorBlind ? 'color: rgb(44, 179, 44)' : 'color: green';
      if (test.testType === 'soak') target.soakWounds = 'all';
      if (testItem?.system?.outstanding) test.extraResult = testItem.system.outstanding;
    } else if (testDifference > 4) {
      test.outcome = game.i18n.localize('torgeternity.chatText.check.result.goodSuccess');
      test.result = TestResult.GOOD;
      test.outcomeColor = useColorBlind ? 'color: rgb(44, 179, 44)' : 'color: green';
      if (test.testType === 'soak') target.soakWounds = 2;
      if (testItem?.system?.good) test.extraResult = testItem.system.good;
    } else {
      test.outcome = game.i18n.localize('torgeternity.chatText.check.result.standardSuccess');
      test.result = TestResult.STANDARD;
      test.outcomeColor = useColorBlind ? 'color: rgb(44, 179, 44)' : 'color: green';
      if (test.testType === 'soak') target.soakWounds = 1;
    }
    if (!useColorBlind && singleResult) test.outcomeColor += SHADOW_STYLE;

    test.showApplySoak = (test.testType === 'soak' && target.soakWounds);

    // Show the "Apply Effects" button if the test has an effect that can be applied
    test.effects = testActor.effects.filter(ef => ef.appliesToTest(test.result, test.attackTraits, target?.defenseTraits)).map(ef => ef.uuid);
    if (testItem) {
      test.effects = test.effects.concat(testItem.effects.filter(ef => ef.appliesToTest(test.result, test.attackTraits, target?.defenseTraits)).map(ef => ef.uuid));
      if (testItem.system?.loadedAmmo) {
        const ammo = testActor.items.get(testItem.system.loadedAmmo);
        if (ammo) test.effects.push(...ammo.effects.filter(ef => ef.appliesToTest(result, test.attackTraits, target?.defenseTraits)).map(ef => ef.uuid));
      }
    }
    target.showApplyEffects = test.effects.map(fx => fromUuidSync(fx)).find(fx => fx.isTransferrable);

    // Approved Action Processing
    test.successfulDefendApprovedAction = false;
    test.successfulApprovedAction = false;
    if (test.result < TestResult.STANDARD) {
      // "Defend is successful once an attack or interaction misses the hero."
      if (target.type === 'stormknight' &&
        (test.testType === 'attack' || test.testType === 'interactionAttack') &&
        game.combat?.approvedActions?.includes('defend') &&
        target.defenses.activeDefense)
        test.successfulDefendApprovedAction = true;
    } else {
      if (testActor.type === 'stormknight' && isApprovedAction(test))
        test.successfulApprovedAction = true;
    }

    // Concentration
    if (first && test.result >= TestResult.STANDARD && testItem?.system.requiresConcentration) {
      await testActor.addConcentration(testItem);
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: testActor }),
        content: game.i18n.format('torgeternity.chatText.concentration.start', { itemName: testItem.name })
      })
    }

    if (test.testType === 'reconnect' && test.result >= TestResult.STANDARD) {
      test.showReconnect = true;
    }
    // Choose Text to Display as Result
    if (testActor.isDisconnected) {
      test.possibilityStyle = 'hidden';
      test.heroStyle = 'hidden';
      test.dramaStyle = 'hidden';
    }

    if (
      test.rollTotal === 1 &&
      !(test.testType === 'activeDefenseUpdate' || test.testType === 'activeDefense')
    ) {
      // Roll 1 and not defense = Mishap
      test.result = TestResult.MISHAP;
      test.resultText = game.i18n.localize('torgeternity.chatText.check.result.mishape');
      if (test?.attackTraits?.includes('fragile')) {
        test.extraResult = game.i18n.format('torgeternity.chatText.check.result.fragileBroken', { itemName: testItem.name });
      }
      if (useColorBlind) {
        test.outcomeColor = 'color: purple';
        test.resultTextStyle = 'color: purple';
      } else if (singleResult) {
        // Only add shadow when displayed at the TOP of the card
        test.outcomeColor += SHADOW_STYLE;
        test.resultTextStyle += SHADOW_STYLE;
      }
      test.skillRollMenuStyle = 'hidden';
      if (test.testType === 'soak')
        test.chatNote =
          game.i18n.localize('torgeternity.sheetLabels.soakNull') +
          game.i18n.localize('torgeternity.sheetLabels.possSpent');

    } else if (test.testType === 'soak') {
      test.resultText = test.outcome;
      test.resultTextStyle = test.outcomeColor;
      if (target.soakWounds > 0) {
        test.chatNote =
          `${target.soakWounds} ` +
          game.i18n.localize('torgeternity.sheetLabels.soakValue') +
          game.i18n.localize('torgeternity.sheetLabels.possSpent');
      } else if (target.soakWounds === 'all') {
        test.chatNote =
          game.i18n.localize('torgeternity.sheetLabels.soakAll') +
          game.i18n.localize('torgeternity.sheetLabels.possSpent');
      } else {
        test.chatNote =
          game.i18n.localize('torgeternity.sheetLabels.soakNull') +
          game.i18n.localize('torgeternity.sheetLabels.possSpent');
      }
      // Create and Manage Active Effect if SK is Actively Defending (thanks Durak!)

    } else if (test.testType === 'activeDefense') {
      // Click on defense
      const oldAD = testActor.activeDefense; // Search for an ActiveDefense effect
      if (oldAD) {
        // if present, reset by deleting
        oldAD.delete();
        return ChatMessage.create({
          // Simple chat message for information
          speaker: ChatMessage.getSpeaker({ actor: testActor }),
          content: game.i18n.localize('torgeternity.chatText.check.result.resetDefense'), // Need to be implemented if incorporated
        });
      } else {
        await testActor.setActiveDefense(test.bonus);
        test.testType = 'activeDefenseUpdate';
        test.resultText = '+ ' + test.bonus;
      }

    } else if (test.testType === 'activeDefenseUpdate') {
      // update bonus in case of bonus roll possibility / up
      // Delete Existing Active Effects
      testActor.activeDefense?.delete();
      if (test.bonus < 1) test.bonus = 1;
      test.resultText = '+ ' + test.bonus;
      // Create new set of active effects
      testActor.setActiveDefense(test.bonus);

    } else {
      test.resultText = test.outcome;
      test.resultTextStyle = test.outcomeColor;
    }

    // If an attack, calculate and display damage
    if (test.isAttack) {
      // Add damage modifier for vital area hits, if necessary
      let adjustedDamage = target.damage;
      if (test.vitalAreaDamageModifier) {
        adjustedDamage = target.damage + test.vitalAreaDamageModifier;
      }
      // add additional Damage from roll dialogue
      if (test?.additionalDamage && !test.explicitBonus) {
        adjustedDamage += test?.additionalDamage;
      }

      // Check for whether a target is present and turn on display of damage sub-label
      if (!target.dummyTarget) {
        const effects = test.effects?.map(fxid => fromUuidSync(fxid));
        if (!test.fxApplied && effects) {
          //test.fxApplied = true;
          adjustedDamage = applyEffects('test.damage', adjustedDamage, effects);
        }
        // NOTE: target.toughness already includes target.armour
        target.targetAdjustedToughness = target.toughness - target.armor;
        // If armor and cover can assist, adjust toughness based on AP effects and cover modifier
        if (test.applyArmor) {
          const armor = target.armor + getExtraProtection(test.attackTraits, target.defenses, 'Armor');
          const weaponAP = applyEffects('test.weaponAP', test.weaponAP, effects);
          target.targetAdjustedToughness += Math.max(0, armor - weaponAP) + test.coverModifier;
        }

        // Generate damage description and damage sublabel
        if (test.result < TestResult.STANDARD) {
          target.damageDescription = game.i18n.localize('torgeternity.chatText.check.result.noDamage');
          target.damageSubDescription = game.i18n.localize('torgeternity.chatText.check.result.attackMissed');
          if (test.attackTraits.includes('unwieldy')) {
            target.damageDescription += ` (${game.i18n.localize('torgeternity.traits.unwieldy')})`;
            test.showActorApplyVeryVulnerable = true;
          }

        } else {
          // Cancel the "unwieldy" which might have been set if previously a failure
          test.showActorApplyVeryVulnerable &&= false;
          // Maybe now good enough to have some BD on it
          if (!target.soakWounds) target.showBD ??= true;

          // Extra BDs based on level success (but this is called many times, so ensure total of 0, 1 or 2 is maintained)
          target.addBDs ??= test.addBDs;
          if (game.settings.get('torgeternity', 'autoRollBD')) {
            target.autoBDs ??= 0;
            if (test.result === TestResult.OUTSTANDING) {
              if (target.autoBDs < 2) target.addBDs += (2 - target.autoBDs);
              target.autoBDs = 2;
            } else if (test.result === TestResult.GOOD) {
              if (!target.autoBDs) target.addBDs += 1;
              target.autoBDs = 1;
            }
          }

          // Add BDs if applicable as this should only be rolled if the test is successful
          if (target.addBDs && !test.explicitBonus) {
            const iteratedRoll = await rollBonusDie(test.trademark, target.addBDs);
            const bdDamage = iteratedRoll.total;
            test.bonusDiceList = test.bonusDiceList ? test.bonusDiceList.concat(iteratedRoll.dice[0].results) : iteratedRoll.dice[0].results;
            target.amountBD += target.addBDs;
            target.addBDs = 0;

            target.bdDamageSum += bdDamage;
            target.damage += bdDamage;
            adjustedDamage += bdDamage;
          }
          // adjustedDamage is already computed from test.damage
          // then modify test.damage for following future computation, and modify the adjustedDamage
          const damage = torgDamage(adjustedDamage, target.targetAdjustedToughness,
            {
              attackTraits: test.attackTraits,
              defenseTraits: target?.defenseTraits,
              soakWounds: target.soakWounds,
            });

          if (damage.wounds || damage.shocks) target.showApplyDamage ??= true;
          target.damageDescription = damage.label;
          target.damageSubDescription =
            `${game.i18n.localize('torgeternity.chatText.check.result.damage')} ${adjustedDamage} vs. ${target.targetAdjustedToughness} ${game.i18n.localize('torgeternity.chatText.check.result.toughness')}`;

          // 'stagger' trait on a weapon inflicts STYMIED after any damage is dealt.
          if ((damage.shocks > 0 || damage.wounds > 0) && test.attackTraits?.includes('stagger')) {
            target.showApplyStymied = true;
          }
        }
      } else {
        // Roll with no targets
        target.damageDescription = `${adjustedDamage} ${game.i18n.localize('torgeternity.chatText.check.result.damage')}`;
      }
    } else if (test.isDefeatTest) {
      if (test.result === TestResult.STANDARD)
        test.defeatInjury = 'permanent'
      else if (test.result === TestResult.GOOD)
        test.defeatInjury = 'temporary';

      // Use non-translated strings to lookup key
      test.defeatMain = game.i18n.format(`torgeternity.defeat.${TestResultKey[test.result]}.main`, { name: testActor.name });
      test.defeatSub = game.i18n.format(`torgeternity.defeat.${TestResultKey[test.result]}.sub`, { name: testActor.name });
    }

    // Label as Skill vs. Attribute Test and turn on BD option if needed
    if (
      test.testType === 'skill' ||
      test.testType === 'reconnect' ||
      test.testType === 'interactionAttack' ||
      test.testType === 'chase' ||
      test.testType === 'stunt' ||
      test.testType === 'vehicleBase'
    ) {
      test.typeLabel = game.i18n.localize('torgeternity.chatText.skillTestLabel');
    } else if (test.testType === 'attack') {
      test.typeLabel = game.i18n.localize('torgeternity.chatText.skillTestLabel');
    } else if (test.testType === 'power') {
      test.typeLabel = game.i18n.localize('torgeternity.chatText.skillTestLabel');
    } else if (test.testType === 'custom') {
      test.typeLabel = game.i18n.localize('torgeternity.chatText.skillTestLabel');
      test.outcomeColor = 'hidden;';
      test.resultTextStyle = 'display:hidden;';
      test.upStyle = 'hidden';
    } else {
      test.typeLabel = game.i18n.localize('torgeternity.chatText.attributeTestLabel');
    }
    test.typeLabel += ' ';

    // Always store the results for this target
    if (!useHighestDN) {
      target.resultText = test.resultText;
      target.resultTextStyle = test.resultTextStyle;
    }

    // Highlight the UP button if the Drama Card shows UP.
    // get disposition from prototype Token if there's no real token.
    const token = testActor.getActiveTokens(false, true)?.[0] || testActor.prototypeToken;  // (linked, document [rather than PlaceableObject])
    if (game.combat?.active && token &&
      ((token.disposition == CONST.TOKEN_DISPOSITIONS.FRIENDLY && game.combat.heroConflict === 'up') ||
        (token.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE && game.combat.villainConflict === 'up')))
      test.upStyle = 'drama-up';

    // Disable unavailable menu options (Note: possibilities are always available)

    if (test.upTotal > 0 && test.upStyle !== 'hidden') test.upStyle = 'disabled';
    if (test.heroTotal > 0 && test.heroStyle !== 'hidden') test.heroStyle = 'disabled';
    if (test.dramaTotal > 0 && test.dramaStyle !== 'hidden') test.dramaStyle = 'disabled';

    if (test.actorType === 'threat') {
      test.heroStyle = 'hidden';
      test.dramaStyle = 'hidden';
      test.hidePlus3 = true;
    }

    if (test.testType === 'interactionAttack' && test.rollResult >= test.DN) {
      target.showApplyDamage = false;
      if (!target.dummyTarget) {
        target.showApplyStymied = true;
        target.showApplyVulnerable = true;
      }
    }

    first = false;
  } // for each target

  const rollMode = game.settings.get("core", "rollMode");
  const flavor = (rollMode === 'publicroll') ? '' : game.i18n.localize(CONFIG.Dice.rollModes[rollMode].label);
  const message = ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: testActor }),
    owner: test.actor,  // actually UUID
    rolls: test.diceroll,
    flavor: flavor,
    flags: {
      torgeternity: {
        test,
        itemId: test.itemId,  // for Automated Animations module
        template: 'systems/torgeternity/templates/chat/skill-card.hbs',
      },
    },
  },
    { rollMode });

  if (game.settings.get('torgeternity', 'unTarget')) {
    // see leftClickRelease in Foundry code
    if (game.canvas) await game.user._onUpdateTokenTargets();
    await game.user.broadcastActivity({ targets: [] });
  }

  return message;
}

/**
 *
 * @param rollTotal
 */
function torgBonus(rollTotal) {
  const VALUES = [0,  // index 0 is inused
    -10, -8, -6, -6, -4, -4, -2, -2, -1, -1,
    0, 0, 1, 1, 2, 3, 4, 5, 6, 7];

  return (rollTotal <= 20) ? VALUES[rollTotal] : (7 + Math.ceil((rollTotal - 20) / 5));
}

/**
 *
 * @param isTrademark Is this roll with the perk of trademark weapon?
 * @param amount The amount of BDs that is ought to roll
 */
export async function rollBonusDie(isTrademark, amount = 1) {
  return await new Roll(`${amount}d6${isTrademark ? 'rr1' : ''}x6max5`).evaluate();
}

/**
 *
 * @param damage
 * @param toughness
 */
export function torgDamage(damage, toughness, options) {
  const damageDiff = Number(damage) - Number(toughness);
  let result;
  if (damageDiff < -5) {
    result = { shocks: 0, wounds: 0 }
  } else if (damageDiff < 0) {
    result = { shocks: 1, wounds: 0 }
  } else if (damageDiff < 5) {
    result = { shocks: 2, wounds: 0 }
  } else {
    const wounds = Math.floor(damageDiff / 5);
    result = { shocks: wounds * 2, wounds: wounds }
  }

  return torgDamageModifiers(result, options);
}


function applyEffects(fieldname, origvalue, effects) {
  if (!effects) return origvalue;
  for (const effect of effects) {
    if (!effect) continue;  // fromUuidSync failed
    for (const change of effect.changes) {
      if (change.key === fieldname) {
        // DataModel.applyField
        // DataField.applyChange
        const value = parseInt(change.value);
        if (isNaN(value)) continue;  // value MUST be a number
        const modes = CONST.ACTIVE_EFFECT_MODES;
        switch (change.mode) {
          case modes.ADD: origvalue += value; break;
          case modes.MULTIPLY: origvalue *= value; break;
          case modes.OVERRIDE: origvalue = value; break;
          case modes.UPGRADE: origvalue = Math.max(origvalue, value); break;
          case modes.DOWNGRADE: origvalue = Math.min(origvalue, value); break;
          default:  // custom
        }
      }
    }
  }
  return origvalue;
}

export function torgDamageModifiers(result, options) {
  let { attackTraits, defenseTraits, soakWounds } = options;

  const flags = [];
  const traits = (attackTraits ?? []).concat(defenseTraits ?? [])

  if (soakWounds) {
    if (soakWounds === 'all') {
      result.wounds = 0;
      result.shocks = 0;
    } else {
      result.wounds -= soakWounds;
      result.shocks = 0;
    }
  }

  if (result.wounds > 0 && traits?.includes('dazing')) {
    flags.push(game.i18n.localize('torgeternity.traits.dazing'));
    result.wounds -= 1;
    result.shocks += 3;
  }
  if (result.wounds > 0 && traits?.includes('ignoreWounds')) {
    flags.push(game.i18n.localize('torgeternity.traits.ignoreWounds'));
    result.wounds = 0;
  }
  if (result.shocks > 0 && traits?.includes('ignoreShock')) {
    flags.push(game.i18n.localize('torgeternity.traits.ignoreShock'));
    result.shocks = 0;
  }
  if (result.shocks > 0 && traits?.includes('painful')) {
    flags.push(game.i18n.localize('torgeternity.traits.painful'));
    result.shocks += 1;
  }

  if (result.shocks > 0 || result.wounds > 0) {
    result.label = (result.wounds > 0) ? `${result.wounds} ${game.i18n.localize('torgeternity.stats.wounds')}` : '';

    if (result.shocks > 0) {
      if (result.label.length) result.label += ' + ';
      result.label += `${result.shocks} ${game.i18n.localize('torgeternity.stats.shock')}`;
    }
    if (traits?.includes('stagger')) flags.push(game.i18n.localize('torgeternity.traits.stagger'));
  } else {
    result.label = game.i18n.localize('torgeternity.chatText.check.result.noDamage');
  }
  if (flags.length) result.label += ` (${flags.join(', ')})`;

  return result;
}

/**
 *@param {Actor} soaker The Actor which is attempting to soak some damage
 */
export async function soakDamages(soaker, origMessageId) {
  const skillName = 'reality';
  const skillValue = soaker.system.skills[skillName].value;

  // Before calculating roll, check to see if it can be attempted unskilled; exit test if actor doesn't have required skill
  if (checkUnskilled(skillValue, skillName, soaker)) return;

  return TestDialog.wait({
    testType: 'soak',
    actor: soaker,
    //actorType: soaker.system.type,
    isFav:
      soaker.system.skills[skillName]?.isFav ||
      soaker.system.attributes[skillName + 'IsFav'] ||
      false,
    skillName: skillName,
    skillValue: skillValue,
    soakingMessage: origMessageId,
  }, { useTargets: true });
  // do reality roll
}

/**
 * Return the Torg value for a given number
 * This could probably be simplified by using the formula for the famous Torg algorhythm
 *
 * @param myNumber
 */
export function getTorgValue(myNumber) {
  if (myNumber <= 1) return 0;
  if (myNumber === 2) return 1;
  if (myNumber === 3) return 2;
  if (myNumber < 6) return 3;
  if (myNumber < 10) return 4;
  if (myNumber < 15) return 5;
  if (myNumber < 25) return 6;
  if (myNumber < 40) return 7;
  if (myNumber < 60) return 8;
  if (myNumber < 100) return 9;
  if (myNumber < 150) return 10;
  if (myNumber < 250) return 11;
  if (myNumber < 400) return 12;
  if (myNumber < 600) return 13;
  if (myNumber < 1000) return 14;
  if (myNumber < 1500) return 15;
  if (myNumber < 2500) return 16;
  if (myNumber < 4000) return 17;
  if (myNumber < 6000) return 18;
  if (myNumber < 10000) return 19;
  if (myNumber < 15000) return 20;
  if (myNumber < 25000) return 21;
  if (myNumber < 40000) return 22;
  if (myNumber < 60000) return 23;
  if (myNumber < 100000) return 24;
  if (myNumber < 150000) return 25;
  if (myNumber < 250000) return 26;
  if (myNumber < 400000) return 27;
  if (myNumber < 600000) return 28;
  if (myNumber < 1000000) return 29;
  if (myNumber < 1500000) return 30;
  if (myNumber < 2500000) return 31;
  if (myNumber < 4000000) return 32;
  if (myNumber < 6000000) return 33;
  if (myNumber < 10000000) return 34;
  if (myNumber < 15000000) return 35;
  if (myNumber < 25000000) return 36;
  if (myNumber < 40000000) return 37;
  if (myNumber < 60000000) return 38;
  if (myNumber < 100000000) return 39;
  if (myNumber < 150000000) return 40;
  if (myNumber < 250000000) return 41;
  if (myNumber < 400000000) return 42;
  if (myNumber < 600000000) return 43;
  if (myNumber < 1000000000) return 44;
  if (myNumber < 1500000000) return 45;
  if (myNumber < 2500000000) return 46;
  if (myNumber < 4000000000) return 47;
  if (myNumber < 6000000000) return 48;
  if (myNumber < 10000000000) return 49;
  if (myNumber < 15000000000) return 50;
  if (myNumber < 25000000000) return 51;
  if (myNumber < 40000000000) return 52;
  if (myNumber < 60000000000) return 53;
  if (myNumber < 100000000000) return 54;
  if (myNumber < 150000000000) return 55;
  if (myNumber < 250000000000) return 56;
  if (myNumber < 400000000000) return 57;
  if (myNumber < 600000000000) return 58;
  return 59;
}

function individualDN(test, target) {

  if (typeof test.DNDescriptor === 'string' && test.DNDescriptor.startsWith('target')) {
    let onTarget = test.DNDescriptor.slice(6);
    onTarget = onTarget.at(0).toLowerCase() + onTarget.slice(1);
    let traitdefense = getExtraProtection(test.attackTraits, target.defenses, 'Defense');
    if (onTarget === 'vehicleDefense')
      return target.defenses?.vehicle ?? 0;
    if (target.attributes && Object.hasOwn(target.attributes, onTarget))
      return target.attributes[onTarget].value + traitdefense;
    if (target.defenses && Object.hasOwn(target.defenses, onTarget))
      return target.defenses[onTarget] + traitdefense;
    if (target.skills && Object.hasOwn(target.skills, onTarget)) {
      const skill = target.skills[onTarget];
      return ((skill.value && skill.value !== '-') ? skill.value : target.attributes[skill.baseAttribute].value) + traitdefense;
    }
  }

  switch (test.DNDescriptor) {
    case 'fixedNumber':
      return test.DNfixed ?? 0;
    // Simple DNs
    case 'veryEasy':
      return 6;
    case 'easy':
      return 8;
    case 'standard':
      return 10;
    case 'challenging':
      return 12;
    case 'hard':
      return 14;
    case 'veryHard':
      return 16;
    case 'heroic':
      return 18;
    case 'nearImpossible':
      return 20;

    // Special Case
    case 'targetWillpowerMind':
      return target.skills.willpower.value
        ? target.skills.willpower.value - target.attributes.spirit.value + target.attributes.mind.value
        : target.attributes.mind.value;

    case 'highestSpeed':
      // Find the fastest participant in the active combat
      let highestSpeed = 0;
      for (const combatant of game.combat.turns) {
        if (!combatant.actor) continue;
        const combatantSpeed = (combatant.actor.type === 'vehicle') ?
          combatant.actor.system.topSpeed.value :
          getTorgValue(combatant.actor.system.other.run);
        if (combatantSpeed > highestSpeed) {
          highestSpeed = combatantSpeed;
        }
      }
      return highestSpeed;
    case 'targetVehicleDefense':
      return target.defenses?.vehicle ?? 0;
    default:
      return 10;
  }
}

async function highestDN(test) {
  let highest = 0;
  for (const target of test.targetAll) {
    highest = Math.max(highest, individualDN(test, target));
  }
  return highest;
}


export async function rollAttack(actor, item) {
  const weaponData = item.system;
  const attackWith = weaponData.attackWith;
  let skillValue;
  let skillData;
  let attributes;

  if (item?.weaponWithAmmo && !item.hasAmmo) {
    ui.notifications.warn(game.i18n.localize('torgeternity.chatText.noAmmo'));
    return;
  }

  if (actor.type === 'vehicle') {
    skillData = item.system.gunnerSkill;
    skillValue = skillData?.value ?? '-';
    attributes = item.system.gunner?.system.attributes ?? 0;
  } else {
    skillData = actor.system.skills[attackWith];
    skillValue = skillData.value;
    attributes = actor.system.attributes;
    if (isNaN(skillValue)) {
      skillValue = skillData.unskilledUse ? attributes[skillData.baseAttribute].value : '-';
    }
  }

  if (checkUnskilled(skillValue, attackWith, actor)) return;

  let dnDescriptor = 'standard';

  if (game.user.targets.size) {
    const firstTarget = game.user.targets.find(token => token.actor.type !== 'vehicle')?.actor ||
      game.user.targets.first().actor;

    if (firstTarget.type === 'vehicle') {
      dnDescriptor = 'targetVehicleDefense';
    } else {
      switch (attackWith) {
        case 'meleeWeapons':
        case 'unarmedCombat':
          dnDescriptor = firstTarget.items
            .filter((it) => it.type === 'meleeweapon' && it.system.equipped).length === 0
            ? 'targetUnarmedCombat'
            : 'targetMeleeWeapons';
          break;
        case 'fireCombat':
        case 'energyWeapons':
        case 'heavyWeapons':
        case 'missileWeapons':
          dnDescriptor = 'targetDodge';
          break;
        default:
          dnDescriptor = 'targetMeleeWeapons';
      }
    }
  }

  // Calculate damage caused by this weapon
  let adjustedDamage = 0;
  const weaponDamage = parseInt(weaponData.damage);
  switch (weaponData.damageType) {
    case 'flat':
      adjustedDamage = weaponDamage;
      break;
    case 'strengthPlus':
      adjustedDamage = attributes.strength.value + weaponDamage;
      break;
    case 'charismaPlus':
      adjustedDamage = attributes.charisma.value + weaponDamage;
      break;
    case 'dexterityPlus':
      adjustedDamage = attributes.dexterity.value + weaponDamage;
      break;
    case 'mindPlus':
      adjustedDamage = attributes.mind.value + weaponDamage;
      break;
    case 'spiritPlus':
      adjustedDamage = attributes.spirit.value + weaponDamage;
      break;
    default:
      adjustedDamage = weaponDamage;
  }
  let weaponAP = weaponData.ap;

  const ammo = weaponData.loadedAmmo && actor.items.get(weaponData.loadedAmmo)?.system;
  if (ammo) {
    if (ammo.damageMod) adjustedDamage += ammo.damageMod;
    if (ammo.apMod) weaponAP += ammo.apMod;
  }

  return TestDialog.wait({
    testType: 'attack',
    actor: actor,
    amountBD: 0,
    isAttack: true,
    isFav: skillData?.isFav || false,
    skillName: attackWith,
    skillValue: Math.max(skillValue, attributes[skillData?.baseAttribute]?.value || 0),
    unskilledUse: true,
    damage: adjustedDamage,
    weaponAP: weaponAP,
    applyArmor: true,
    DNDescriptor: dnDescriptor,
    type: 'attack',
    applySize: true,
    attackOptions: true,
    chatNote: weaponData.chatNote,
    bdDamageSum: 0,
    itemId: item.id,
  }, { useTargets: true });
}


export async function rollPower(actor, item) {
  const powerData = item.system;
  const skillName = powerData.skill;
  const skillData = actor.system.skills[skillName];

  // Set modifier for this power
  const powerModifier = item.system.modifier || 0;

  if (checkUnskilled(skillData.value, skillName, actor)) return;

  return TestDialog.wait({
    testType: 'power',
    actor: actor,
    powerName: item.name,
    powerModifier: powerModifier,
    isAttack: powerData.isAttack,
    isFav: skillData.isFav,
    skillName: skillName,
    skillAdds: skillData.adds,
    skillValue: Math.max(skillData.value, actor.system.attributes[skillData.baseAttribute].value),
    unskilledUse: false,
    damage: powerData.damage,
    weaponAP: powerData.ap,
    applyArmor: powerData.applyArmor,
    DNDescriptor: powerData.dn,
    applySize: powerData.applySize,
    attackOptions: true,
    amountBD: 0,
    bdDamageSum: 0,
    itemId: item.id,
  }, { useTargets: true });
}

export async function rollAttribute(actor, attributeName) {
  return TestDialog.wait({
    testType: 'attribute',
    actor: actor,
    skillName: attributeName,
    skillValue: actor.system.attributes[attributeName].value,
    isFav: actor.system.attributes?.[attributeName + 'IsFav']
  }, { useTargets: true });
}


export async function rollSkill(actor, skillName) {

  const skillData = actor.system.skills[skillName] ?? actor.items.get(skillName)?.system;
  if (!skillData) return;

  // Before calculating roll, check to see if it can be attempted unskilled; exit test if actor doesn't have required skill
  if (checkUnskilled(skillData.value, skillName, actor)) return;
  let testType = 'skill';

  // Check if character is trying to roll on reality while disconnected- must be allowed if reconnection-roll
  if (skillName === 'reality' && actor.isDisconnected) {
    testType = 'reconnect';
    const confirmed = await DialogV2.confirm({
      window: { title: 'torgeternity.dialogWindow.realityCheck.title' },
      content: game.i18n.localize('torgeternity.dialogWindow.realityCheck.content'),
    });

    if (!confirmed) {

      foundry.applications.handlebars.renderTemplate(
        './systems/torgeternity/templates/chat/skill-error-card.hbs',
        {
          message: game.i18n.localize('torgeternity.chatText.check.cantUseRealityWhileDisconnected'),
          actor: actor.uuid,
          actorPic: actor.img,
          actorName: actor.name,
        }
      ).then(content =>
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: actor }),
          owner: actor,
          content: content
        })
      )
      // Don't wait for chat message to finish posting
      return;
    }
  }

  return TestDialog.wait({
    testType: testType,
    customSkill: !actor.system.skills[skillName],
    actor: actor,
    isFav: skillData.isFav,
    skillName: skillName,
    skillValue: skillData.value,
  }, { useTargets: (testType === 'skill') });
}

export async function rollUnarmedAttack(actor, skillName) {
  let dnDescriptor = 'standard';
  if (game.user.targets.size) {
    const firstTarget = game.user.targets.find(token => token.actor.type !== 'vehicle')?.actor ||
      game.user.targets.first().actor;

    if (firstTarget.type === 'vehicle') {
      dnDescriptor = 'targetVehicleDefense';
    } else {
      firstTarget.items
        .filter((it) => it.type === 'meleeweapon')
        .filter((it) => it.system.equipped).length !== 0
        ? (dnDescriptor = 'targetMeleeWeapons')
        : (dnDescriptor = 'targetUnarmedCombat');
    }
  }

  // Almost the same as rollAttack
  return TestDialog.wait({
    testType: 'attack',
    actor: actor,
    amountBD: 0,
    isAttack: true,
    isFav: actor.system.skills[skillName]?.isFav,
    skillName: skillName,
    skillValue: actor.system.skills[skillName]?.value ?? actor.system.attributes.dexterity.value,
    unskilledUse: true,
    damage: actor.unarmed.damage,
    weaponAP: 0,
    applyArmor: true,
    DNDescriptor: dnDescriptor,
    type: 'attack',
    applySize: true,
    attackOptions: true,
    //chatNote: '',
    bdDamageSum: 0,
    // itemId - no item
  }, { useTargets: true });
}

export async function rollInteractionAttack(actor, skillName) {
  const skillData = actor.system.skills[skillName];

  let dnDescriptor = 'standard';
  if (game.user.targets.size) {
    switch (skillName) {
      case 'intimidation':
        dnDescriptor = 'targetIntimidation';
        break;
      case 'maneuver':
        dnDescriptor = 'targetManeuver';
        break;
      case 'taunt':
        dnDescriptor = 'targetTaunt';
        break;
      case 'trick':
        dnDescriptor = 'targetTrick';
        break;
      default:
        dnDescriptor = 'standard';
    }
  } else {
    dnDescriptor = 'standard';
  }

  return TestDialog.wait({
    testType: 'interactionAttack',
    actor: actor,
    skillName: skillName,
    skillAdds: skillData.adds,
    skillValue: Number(skillData.value),
    isFav: actor.system.skills[skillName].isFav,
    unskilledUse: true,
    DNDescriptor: dnDescriptor,
    type: 'interactionAttack',
  }, { useTargets: true });
}

export async function rollTapping(actor, item) {
  const dn = item.system?.tappingDifficulty;
  if (!dn) return ui.notifications.info(`Item does not have a Tapping Difficulty`);

  const skillName = 'reality';
  const skillData = actor.system?.skills[skillName];
  if (!skillData) return ui.notifications.info(`Actor does not have the skill ${skillName}`);
  //const attributeName = skillData.baseAttribute;
  const skillValue = Number(skillData.value);

  // Can't use reality while disconnected
  if (actor.isDisconnected) {
    return foundry.applications.handlebars.renderTemplate(
      './systems/torgeternity/templates/chat/skill-error-card.hbs',
      {
        message: game.i18n.localize('torgeternity.chatText.check.cantUseRealityWhileDisconnected'),
        actor: actor.uuid,
        actorPic: actor.img,
        actorName: actor.name,
      }
    ).then(content =>
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        owner: actor,
        content: content
      })
    )
  }

  return TestDialog.wait({
    testType: 'skill',
    actor: actor,
    isFav:
      skillData.isFav ||
      actor.system.attributes?.[skillName + 'IsFav'],
    skillName: skillName,
    skillValue: skillValue,
    chatTitle: game.i18n.localize('torgeternity.chatText.tapping'),
    DNDescriptor: 'fixedNumber',
    DNfixed: dn
  });
}

function isApprovedAction(test) {
  if (!game.combat?.approvedActions) return false;

  // maneuver, trick, taunt, intimidate, any, attack, defend, "any multi-action"
  for (const action of game.combat.approvedActions) {
    switch (action) {
      case 'any':
        return true;
      case 'intimidate':
        // Drama Card: intimidate
        // Skill: intimidation
        if (test.testType === 'interactionAttack' && test.skillName === 'intimidation') return true;
        break;
      case 'maneuver':
      case 'taunt':
      case 'trick':
        // interactionAttack = intimidate, maneuver, taunt, trick
        if (test.testType === 'interactionAttack' && test.skillName === action) return true;
        break;
      case 'attack':
        if (test.testType === 'attack') return true;
        break;
      case 'multiAction':
        if (test.multiModifier) return true;
        break;
      case 'defend':
        // defend ("Defend is successful once an attack or interaction misses the hero.")
        break;
      default:
        console.info(`Unrecognised Approved Action: '${action}'`)
        break;
    }
  }
  return false;
}
/**
 * For each '*Damage' trait in 'attackTraits' look for a corresponding "*${protection}" in defenseTraits.
 * If found, then return the numeric value for that defensive trait.
 * @param {String[]} attackerTraits The attack traits of the attacker
 * @param {String[]} targetDefenses The defenses of the target
 * @param {String} protection The type of trait to look for on the target (e.g. 'Armor' , 'Defense')
 * @returns {Number} The numeric value of the corresponding targetTrait, or 'defaultValue'
 */
function getExtraProtection(attackerTraits, targetDefenses, protection) {
  if (!attackerTraits) return 0;
  let result = 0;
  for (const atktrait of attackerTraits) {
    if (atktrait.endsWith('Damage')) {
      const deftrait = atktrait.slice(0, -6) + protection;
      // TODO - where do we get the actual number from?
      if (Object.hasOwn(targetDefenses, deftrait)) {
        if (CONFIG.debug.torgtest) console.debug(`EXTRA DEFENSE: ${deftrait} vs ${atktrait}`)
        result += targetDefenses[deftrait] ?? 0;
      }
    }
  }
  return result;
}

/**
 * Checks to see if the given skill is actually unskilled for the indicated actor.
 * If unskilled, a message is sent to the chat log.
 * @param {String} skillValue The value of the skill being checked
 * @param {Number} skillName The name of the skill being checked
 * @param {Actor} actor The actor whose skilled nature is being checked
 * @returns {Boolean} Returns true if the actor is UNSKILLED at 'skillName'
 */
export function checkUnskilled(skillValue, skillName, actor) {
  if (skillValue) return false;

  foundry.applications.handlebars.renderTemplate(
    './systems/torgeternity/templates/chat/skill-error-card.hbs',
    {
      message: game.i18n.localize('torgeternity.skills.' + skillName) + ' ' + game.i18n.localize('torgeternity.chatText.check.cantUseUntrained'),
      actor: actor.uuid,
      actorPic: actor.img,
      actorName: actor.name,
    }).then(content =>
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        owner: actor,
        content: content
      })
    )

  return true;
}