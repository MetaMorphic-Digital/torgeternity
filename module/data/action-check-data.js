import TorgeternityActor from '../documents/actor/torgeternityActor.js';
import { applyNumericChange, applyNumericEffects } from '../torgutils.js';

const fields = foundry.data.fields;

function integerField(initial = 0) {
  // Core defaults:
  // required: false,
  // nullable: true,
  // min: undefined,
  // max: undefined,
  // step: undefined,
  // integer: false,
  // positive: false,
  // choices: undefined
  return new fields.NumberField({ initial, nullable: false, required: true, integer: true })
}

function booleanField() {
  // Core defaults:
  // required: true,
  // nullable: false,
  // initial: false
  return new fields.BooleanField();
}

export class ActionCheckData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      actor: new fields.DocumentUUIDField({ required: true }),
      actorName: new fields.StringField({ initial: '', blank: true }),
      actorPic: new fields.FilePathField({ categories: ["IMAGE"] }),
      actorType: new fields.StringField({ initial: '', blank: true }),
      testType: new fields.StringField({ initial: 'skill', required: true, blank: false }),
      typeLabel: new fields.StringField(),
      DNDescriptor: new fields.StringField({ initial: 'standard', blank: false }),
      DNfixed: integerField(),
      itemId: new fields.DocumentIdField(),
      isFrozen: booleanField(),
      // bonus-selector
      bonus: new fields.NumberField({ initial: null, required: false, nullable: true, integer: true }),      // null or number
      explicitBonus: booleanField(),
      diceTotal: integerField(),
      rollTotal: integerField(),   // 0 = force a manual dice roll
      damage: integerField(),
      isFav: booleanField(),
      disfavored: booleanField(),
      isConcentrationCheck: booleanField(),
      requiresConcentration: booleanField(),
      unskilledTest: booleanField(),
      ammoCount: integerField(),
      skillName: new fields.StringField({ initial: '', blank: true }),
      skillValue: integerField(),
      customSkill: booleanField(),
      targetSelf: booleanField(),
      hasModifiers: booleanField(),
      movementModifier: integerField(),   // movement-penalty
      multiModifier: integerField(),  // multi-action
      targetsModifier: integerField(),  // multi-target
      powerModifier: integerField(),
      actionTotal: integerField(),
      actionTotalContent: new fields.StringField({ initial: '', blank: true }),
      attackTraits: new fields.ArrayField(new fields.StringField()),
      // attack-options
      calledShotModifier: integerField(),
      concentratingModifier: integerField(),
      vitalAreaDamageModifier: booleanField(),
      burstModifier: integerField(),
      allOutFlag: booleanField(),
      aimedFlag: booleanField(),
      blindFireFlag: booleanField(),
      trademark: booleanField(),
      additionalDamage: new fields.NumberField({ nullable: true }),
      bdDamageSum: integerField(),
      addBDs: integerField(),  // 0-5
      plus3type: new fields.StringField({ initial: '', blank: true, choices: ["physical", "mental"] }),
      chatTitle: new fields.StringField({ initial: '', blank: true }),
      // modifiers
      other1Description: new fields.StringField({ initial: '', blank: true }),
      other1Modifier: integerField(),
      other2Description: new fields.StringField({ initial: '', blank: true }),
      other2Modifier: integerField(),
      other3Description: new fields.StringField({ initial: '', blank: true }),
      other3Modifier: integerField(),
      modifiers: integerField(),
      modifierText: new fields.StringField({ initial: '', blank: true }),
      // fixed-modifiers
      ignoreModifiers: booleanField(),
      concealmentModifier: integerField(),
      stymiedModifier: integerField(),
      darknessModifier: integerField(),
      waitingModifier: integerField(),
      vulnerableModifier: integerField(),
      woundModifier: integerField(),
      sizeModifier: integerField(),
      speedModifier: integerField(),
      rangeModifier: integerField(),
      maneuverModifier: integerField(),
      coverModifier: integerField(),
      targetDarknessModifier: integerField(),
      targetRangeModifier: integerField(),
      soakingMessage: new fields.DocumentIdField({ required: false }),
      // sheet flags
      attackOptions: booleanField(),
      isAttack: booleanField(),
      applySize: booleanField(),
      chatNote: new fields.StringField({ initial: '', blank: true }),
      combinedAction: new fields.SchemaField({
        participants: integerField(1),
        torgBonus: integerField(),
        forDamage: booleanField(),
      }),
      result: new fields.StringField({ initial: '', blank: true }),
      resultText: new fields.StringField({ initial: '', blank: true }),
      resultTextClass: new fields.StringField({ initial: '', blank: true }),
      showApplySoak: booleanField(),
      showApplyEffects: booleanField(),
      showActorApplyVeryVulnerable: booleanField(),
      successfulDefendApprovedAction: booleanField(),
      successfulApprovedAction: booleanField(),
      concentratingId: new fields.DocumentUUIDField({ required: false }),
      showReconnect: booleanField(),
      possibilityClass: new fields.StringField({ initial: '', blank: true }),
      heroClass: new fields.StringField({ initial: '', blank: true }),
      upClass: new fields.StringField({ initial: '', blank: true }),
      dramaClass: new fields.StringField({ initial: '', blank: true }),
      extraResult: new fields.StringField({ initial: '', blank: true }),
      defeatInjury: new fields.StringField({ initial: '', blank: true }),
      defeatMain: new fields.StringField({ initial: '', blank: true }),
      defeatSub: new fields.StringField({ initial: '', blank: true }),
      hidePlus3: booleanField(),
      //dicerolled: new fields.ArrayField(new fields.ObjectField()),  // foundry.dice.Roll[]
      diceList: new fields.ArrayField(new fields.ObjectField()),
      effects: new fields.ArrayField(new fields.ObjectField(foundry.documents.BaseActiveEffect)),
      torgDiceStyle: booleanField(),
      hideFavButton: booleanField(),
      ignoreContradictions: booleanField(),
      upTotal: integerField(),
      possibilityTotal: integerField(),
      heroTotal: integerField(),
      dramaTotal: integerField(),
      combinedRollTotal: integerField(),
      cardsPlayed: integerField(),
      targets: new fields.ArrayField(new fields.SchemaField({
        type: new fields.StringField({ initial: '', blank: false }),  // actor.type
        dummyTarget: booleanField(),
        id: new fields.DocumentIdField(),  // token.actor.id
        actorUuid: new fields.DocumentUUIDField(),  // token.actor.uuid
        uuid: new fields.DocumentUUIDField(),  // token.document.uuid
        targetPic: new fields.FilePathField({ categories: ["IMAGE"] }),
        targetName: new fields.StringField(),
        damage: new fields.NumberField(),
        sizeModifier: integerField(),
        toughness: integerField(),
        targetAdjustedToughness: integerField(),
        armor: integerField(),
        defenseTraits: new fields.ArrayField(new fields.StringField),
        rangeModifier: integerField(),
        amountBD: integerField(),
        bdDamageSum: integerField(),
        damageDescription: new fields.StringField(),
        damageSubDescription: new fields.StringField(),
        showBD: new fields.BooleanField({ initial: null, nullable: true }),
        showApplyDamage: booleanField(),
        showApplyEffects: booleanField(),
        showApplyStymied: booleanField(),
        showApplyVulnerable: booleanField(),
        soakWounds: booleanField(),
        addBDs: integerField(),
        autoBDs: integerField(),
        resultText: new fields.StringField({ initial: '', blank: true }),
        resultTextClass: new fields.StringField({ initial: '', blank: true }),
        bonusDiceList: new fields.ArrayField(new fields.ObjectField()),
        // then vehicle specifics
        defenses: new fields.SchemaField({
          vehicle: integerField(),
          dodge: integerField(),
          unarmedCombat: integerField(),
          meleeWeapons: integerField(),
          intimidation: integerField(),
          maneuver: integerField(),
          taunt: integerField(),
          trick: integerField(),
          activeDefense: integerField(),
          // Armor: addition armor of the defender when damage is of the indicated type
          energyArmor: integerField(),
          fireArmor: integerField(),
          forceArmor: integerField(),
          iceArmor: integerField(),
          lightningArmor: integerField(),
          // Defense: increases the Defense skill of the defender when damage is of the indicated type
          energyDefense: integerField(),
          fireDefense: integerField(),
          forceDefense: integerField(),
          iceDefense: integerField(),
          lightningDefense: integerField(),
        }),
        skills: new fields.ObjectField(),
        attributes: new fields.ObjectField(),
        vulnerableModifier: integerField(),
        darknessModifier: integerField(),
        isConcentrating: booleanField(),
      }))
    }
  }

  constructor(data, options) {
    if (data.actor instanceof TorgeternityActor) data.actor = data.actor.uuid;
    super(data, options);
  }

  /**
   * 
   * @param {TorgActor} actor 
   * @param {String} itemId ID of the item on the actor (if any)
   * @returns {ActionCheckData} This object
   */
  setActor(actor, itemId = undefined) {
    const updates = {};

    updates.actor = actor.uuid;
    if (!this.actorPic) updates.actorPic = actor.img;
    if (!this.actorName) updates.actorName = actor.name;
    if (!this.actorType) updates.actorType = actor.type;

    const item = itemId && actor.items.get(this.itemId);
    if (item) {
      updates.trademark = item.system.traits.has('trademark');
      updates.requiresConcentration = item.system.requiresConcentration;
    }

    updates.attackTraits = item ? Array.from(item.system.traits) : [];
    if (item?.system?.loadedAmmo) {
      const ammo = actor.items.get(item?.system.loadedAmmo);
      if (ammo) updates.attackTraits.push(...Array.from(ammo.system.traits));
    }
    updates.attackTraits.push(...Array.from(actor.statuses), ...Array.from(actor.system.extraTraits));

    const combatant = game.combat?.getCombatantsByActor(actor)?.shift();
    if (combatant) {
      const bonus = combatant.currentBonus;
      if (Number.isInteger(bonus)) updates.bonus = bonus;
    }

    // Actor has some overrides for this particular test (e.g. soak.isFav)
    const overrides = actor.system?.testOverride?.[this.testType];
    if (overrides)
      foundry.utils.mergeObject(updates, overrides, { overwrite: true, inplace: true });

    // The wound penalties are never more than -3, regardless on how many wounds a token can suffer / have. CrB p. 117
    updates.woundModifier = -Math.min(actor.system.wounds.value ?? 0, 3);

    updates.stymiedModifier = actor.system.statusModifiers.stymied;
    updates.waitingModifier = actor.system.statusModifiers.waiting;
    updates.targetDarknessModifier = actor.system.targetModifiers.darkness;
    updates.targetRangeModifier = actor.system.targetModifiers.range;

    // Concentrating modifier applies in Concentration Checks and specific skills
    if (this.isConcentrationCheck ||
      CONFIG.torgeternity.concentrationSkills.includes(this.skillName)) {
      updates.concentratingModifier = actor.system.statusModifiers.concentrating;
    }
    const testItem = this.itemId && actor.items.get(this.itemId);
    updates.requiresConcentration = testItem?.system.requiresConcentration;

    if (!this.combinedAction.participants)
      updates["combinedAction.participants"] ??= game.canvas?.tokens?.controlled?.length || 1;

    // Set Modifiers for Vehicles
    if (this.testType === 'chase') {
      if (this.vehicleSpeed < 11) {
        updates.speedModifier = 0;
      } else if (this.vehicleSpeed < 15) {
        updates.speedModifier = 2;
      } else if (this.vehicleSpeed < 17) {
        updates.speedModifier = 4;
      } else {
        updates.speedModifier = 6;
      }
      // maneuverModifier already set in TorgeternityActorSheet
    } else if (this.testType === 'stunt' || this.testType === 'vehicleBase') {
      // Do Nothing - this leaves maneuverModifier in place
    } else {
      updates.speedModifier = 0;
      updates.maneuverModifier = 0;
    }

    return this.updateSource(updates);
  }

  get targetPresent() {
    return !!this.targets.length;
  }

  get hasModifiers() {
    return !!(this.woundModifier ||
      this.stymiedModifier ||
      this.darknessModifier ||
      this.waitingModifier ||
      this.concentratingModifier ||
      this.sizeModifier ||
      this.vulnerableModifier ||
      this.speedModifier ||
      this.maneuverModifier)
  }

  /**
   * 
   * @param {Array<Token>} targets 
   */
  setTargets(targets, options = {}) {
    const actor = fromUuidSync(this.actor);
    const updates = {};
    const actingToken = actor.getActiveTokens()?.[0];
    const testItem = this.itemId && actor.items.get(this.itemId);
    //this.targetPresent = !!targets.length;
    const MULTITARGET = [0, 0, -2, -4, -6, -8, -10];
    if (!this.targetsModifier && !this.ignoreModifiers)
      updates.targetsModifier = MULTITARGET[testItem?.hasBlastTrait ? 1 : targets.length] ?? 0;

    updates.rangeModifier = 0;
    if (targets.length && this.testType !== 'soak') {
      updates.targets = targets.map(token => this.#oneTarget(token, actingToken, testItem));
      if (!this.ignoreModifiers) {
        updates.sizeModifier = Math.max(...updates.targets.map(target => target.sizeModifier));
        updates.vulnerableModifier = Math.max(...updates.targets.map(target => target.vulnerableModifier));
        updates.darknessModifier = Math.min(0, Math.min(...updates.targets.map(target => target.darknessModifier)) + this.targetDarknessModifier);
        updates.rangeModifier = Math.min(...updates.targets.map(target => target.rangeModifier)) + this.targetRangeModifier;
      }
    } else {
      updates.targets = [{  // dummyTestTargets
        dummyTarget: true,
        type: 'dummy',
      }];
    }
    // Maybe there is an explicit amount of damage
    for (const target of updates.targets)
      target.damage = this.damage ?? 0;
    return this.updateSource(updates);
  }

  applyEffects() {
    const actor = fromUuidSync(this.actor);
    const updates = {};

    // Check actor to see if they want to modify any of the modifiers.
    // TODO - we need to check others fields too, at this point?  (so 'test.damage' shouldn't get set here)
    let changed = false;
    for (const effect of actor.allApplicableEffects())
      if (effect.active || (!effect.disabled && !effect.isTransferrable && effect.system.activeIfTrait.has(this.skillName)))
        for (const change of effect.system.changes)
          if (change.key.startsWith('test.') && change.key.endsWith('Modifier')) {
            const key = change.key.slice(5);
            if (foundry.utils.hasProperty(this, key)) {
              if (!foundry.utils.hasProperty(updates, key)) updates[key] = this[key];
              updates[key] = applyNumericChange(updates[key], change);
              changed = true;
            }
          }
    if (changed) {
      // Validate range of modifiers
      const maxZero = ['woundModifier', 'stymiedModifier', 'darknessModifier', 'waitingModifier', 'targetsModifier', 'concentratingModifier',
        'movementModifier', 'multiModifier', 'targetsModifier', 'vulnerableModifier'];
      const minZero = ['burstModifier'];
      for (const key of maxZero) if (foundry.utils.hasProperty(updates, key) && updates[key] > 0) updates[key] = 0;
      for (const key of minZero) if (foundry.utils.hasProperty(updates, key) && updates[key] < 0) updates[key] = 0;
    }

    return this.updateSource(updates);
  }

  #oneTarget(token, actingToken, testItem) {
    const actor = token.actor;

    let sizeModifier = 0;
    if (this.applySize) {
      switch (actor.system.details.sizeBonus) {
        case 'normal': sizeModifier = 0; break;
        case 'tiny': sizeModifier = -6; break;
        case 'verySmall': sizeModifier = -4; break;
        case 'small': sizeModifier = -2; break;
        case 'large': sizeModifier = 2; break;
        case 'veryLarge': sizeModifier = 4; break;
        default: sizeModifier = 0; break;
      }
    }

    const damageDefenses = Object.entries(actor.system.defenses.damageTraits)
      .filter(([_key, value]) => value)
      .reduce((acc, [key, value]) => (acc[key] = value, acc), {})

    let rangeModifier = 0;
    if (actingToken && testItem?.system?.rangePenalty)
      rangeModifier = testItem.system.rangePenalty(token.distanceToToken(actingToken));

    // Set vehicle defense if needed
    switch (actor.type) {
      case 'vehicle':
        return {
          type: actor.type,
          id: actor.id,
          actorUuid: actor.uuid,
          uuid: token.document.uuid,
          targetPic: actor.img,
          targetName: token.name,
          sizeModifier: sizeModifier,
          toughness: actor.system.defenses.toughness,
          armor: actor.system.defenses.armor,
          defenseTraits: actor.defenseTraits,
          rangeModifier,
          amountBD: 0,
          bdDamageSum: 0,
          // then vehicle specifics
          defenses: {
            ...damageDefenses,
            vehicle: actor.system.defense,
            dodge: actor.system.defense,
            unarmedCombat: actor.system.defense,
            meleeWeapons: actor.system.defense,
            intimidation: actor.system.defense,
            maneuver: actor.system.defense,
            taunt: actor.system.defense,
            trick: actor.system.defense,
            activeDefense: actor.system.defenses.activeDefense
          },
        };

      case 'threat':
      case 'stormknight':
        {
          const result = {
            type: actor.type,
            id: actor.id,
            actorUuid: actor.uuid,
            uuid: token.document.uuid,
            targetPic: actor.img,
            targetName: token.name,
            sizeModifier: sizeModifier,
            toughness: actor.system.defenses.toughness,
            armor: actor.system.defenses.armor,
            defenseTraits: actor.defenseTraits,
            rangeModifier,
            // then non-vehicle changes
            skills: actor.itemTypes.customSkill.reduce((acc, skill) => {
              acc[toCamelCase(skill.name)] = { value: skill.system.value, defenseMod: skill.system.defenseMod, baseAttribute: skill.system.baseAttribute };
              return acc;
            },
              Object.entries(actor.system.skills).reduce((acc, [skillName, skill]) => {
                acc[skillName] = { value: skill.value, defenseMod: skill.defenseMod ?? 0, baseAttribute: skill.baseAttribute }
                return acc;
              }, {})),
            attributes: Object.entries(actor.system.attributes).reduce((acc, [key, attr]) => (acc[key] = attr.value + attr.defenseMod, acc), {}),
            vulnerableModifier: actor.system.statusModifiers.vulnerable,
            darknessModifier: actor.system.statusModifiers.darkness,
            isConcentrating: actor.isConcentrating,
            amountBD: 0,
            bdDamageSum: 0,
            defenses: {
              ...damageDefenses,
              dodge: actor.system.defenses.dodge.value,
              unarmedCombat: actor.system.defenses.unarmedCombat.value,
              meleeWeapons: actor.system.defenses.meleeWeapons.value,
              intimidation: actor.system.defenses.intimidation.value,
              maneuver: actor.system.defenses.maneuver.value,
              taunt: actor.system.defenses.taunt.value,
              trick: actor.system.defenses.trick.value,
              activeDefense: actor.system.defenses.activeDefense
            },
          };

          // Check for any AEs on the defender with the `defendAgainstTrait` set
          if (this.attackTraits?.length || this.defenseTraits?.length) {
            const effects = [];
            for (const effect of actor.allApplicableEffects()) {
              // It will be suppressed, so effect.active will return false
              if (!effect.disabled && !effect.system.transferOnOutcome && effect.system.defendAgainstTrait.size) {
                let found = 0;
                const required = effect.system.defendAgainstTraitCombine === 'or' ? 1 : effect.system.defendAgainstTrait.size;
                for (const trait of effect.system.defendAgainstTrait) {
                  if (this.skillName === trait || this.attackTraits?.includes(trait) || this.defenseTraits?.includes(trait)) {
                    if (++found === required) break;
                  }
                }
                if (found === required) effects.push(effect);
              }
            }
            const changekeys = effects.map(effect => effect.system.changes).flat().reduce((set, change) => set.add(change.key), new Set());
            for (const changekey of changekeys) {
              if (changekey === 'system.defenses.all.mod') {
                for (const field of ['defenses.dodge', 'defenses.unarmedCombat', 'defenses.meleeWeapons', 'defenses.intimidation', 'defenses.maneuver', 'defenses.taunt', 'defenses.trick']) {
                  const value = foundry.utils.getProperty(result, field);
                  if (typeof value !== 'number')
                    console.warn(`Non-numeric field referenced in changes of defendAgainstTrait: '${field}'`)
                  else
                    foundry.utils.setProperty(result, field, applyNumericEffects(changekey, value, effects));
                }
              } else if (changekey === 'system.defenses.physical.mod') {
                for (const field of ['defenses.dodge', 'defenses.unarmedCombat', 'defenses.meleeWeapons']) {
                  const value = foundry.utils.getProperty(result, field);
                  if (typeof value !== 'number')
                    console.warn(`Non-numeric field referenced in changes of defendAgainstTrait: '${field}'`)
                  else
                    foundry.utils.setProperty(result, field, applyNumericEffects(changekey, value, effects));
                }
              } else if (changekey === 'system.defenses.interaction.mod') {
                for (const field of ['defenses.intimidation', 'defenses.maneuver', 'defenses.taunt', 'defenses.trick']) {
                  const value = foundry.utils.getProperty(result, field);
                  if (typeof value !== 'number')
                    console.warn(`Non-numeric field referenced in changes of defendAgainstTrait: '${field}'`)
                  else
                    foundry.utils.setProperty(result, field, applyNumericEffects(changekey, value, effects));
                }
              } else {
                const MAPPING = {
                  'system.defenses.toughness': 'toughness',
                  'system.defenses.armor': 'armor',
                  'system.statusModifiers.vulnerable': 'vulnerableModifier',
                  'system.statusModifiers.darkness': 'darknessModifier',
                }
                const field = MAPPING[changekey] ?? changekey.replace(/^system./, '').replace(/.mod$/, '');
                const value = foundry.utils.getProperty(result, field);
                if (typeof value !== 'number')
                  console.warn(`Non-numeric field referenced in changes of defendAgainstTrait: '${field}'`)
                const newvalue = applyNumericEffects(changekey, value, effects);
                foundry.utils.setProperty(result, field, newvalue);
                // Armor should be included in the toughness value (and will be removed if required later)
                if (field === 'armor') result.toughness += (newvalue - value);
              }
            }
          }

          return result;
        }

      default:
        console.warn(`Unknown actor type '${actor.type}'`);
        return null;
    }
  }
  /**
   * Freezes the current action total, preventing further modification
   */
  freezeTotal() {
    this.isFrozen = true;
  }

  /**
   * @returns {boolean}
   */
  isTotalFrozen() {
    return this.isFrozen;
  }

  // as per BaseChatMessage.#validateRoll
  static #validateRoll(rollJSON) {
    const data = JSON.parse(rollJSON);
    if (Array.isArray(data) && !data.length) return;
    const roll = foundry.dice.Roll.fromData();
    if (!roll.evaluated) throw new Error("Roll objects added to ActionCheckData documents must be evaluated");
  }
}