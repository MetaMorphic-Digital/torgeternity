import { TestResult } from '../../torgchecks.js';

/**
 * Extend the basic ActiveEffect model with migrations and TORG specific handling
 */
export default class TorgActiveEffect extends foundry.documents.ActiveEffect {

  /**
   *
   * @param {object} source the data object to migrate
   * @returns {object} the migrated data object
   */
  static migrateData(source) {
    if (Object.hasOwn(source, 'changes')) {
      const migrationDictionary = {
        // SK and Threat attribute modifiers
        'system.attributes.charisma': 'system.attributes.charisma.value',
        'system.attributes.mind': 'system.attributes.mind.value',
        'system.attributes.strength': 'system.attributes.strength.value',
        'system.attributes.dexterity': 'system.attributes.dexterity.value',
        'system.attributes.spirit': 'system.attributes.spirit.value',
        // SK and Threat general path cleaning
        'system.other.fatigue': 'fatigue',
        'system.fatigue': 'fatigue',
        'system.unarmedDamage': 'unarmed.damageMod',
        'system.unarmedDamageMod': 'unarmed.damageMod',
        // SK and Threat defense modifiers
        'system.dodgeDefenseMod': 'defenses.dodge.mod',
        'system.meleeWeaponsDefenseMod': 'defenses.meleeWeapons.mod',
        'system.unarmedCombatDefenseMod': 'defenses.unarmedCombat.mod',
        'system.intimidationDefenseMod': 'defenses.intimidation.mod',
        'system.maneuverDefenseMod': 'defenses.maneuver.mod',
        'system.tauntDefenseMod': 'defenses.taunt.mod',
        'system.trickDefenseMod': 'defenses.trick.mod',
        // SK and Threat armor and toughness
        'system.other.armor': 'defenses.armor',
        'system.other.toughness': 'defenses.toughness',
        // Vehicle armor and toughness
        'system.armor': 'defenses.armor',
        'system.toughness': 'defenses.toughness',
        // modify maxDex and minStr
        'system.maxDex': 'system.other.maxDex',
        'system.minStr': 'system.other.minStr',
        'system.attributes.minStr': 'system.other.minStr',
        'system.attributes.maxDex': 'system.other.maxDex',
        'system.other.possibilities': 'system.other.possibilities.perAct',
      };
      for (const change of source.changes) {
        if (Object.hasOwn(migrationDictionary, change.key)) {
          change.key = migrationDictionary[change.key];
        }
      }
      for (const change of source.changes) {
        if (change.key.includes('.isFav') && (change.value === '1' || change.value === '0')) {
          change.value = change.value === '1' ? 'true' : 'false';
        } else if (change.key.includes('.isFav') && (change.value === 'True' || change.value === 'False')) {
          change.value = change.value.toLowerCase();
        }
      }
    }

    // Replace flags
    if (source.flags?.torgeternity?.transferOnAttack !== undefined) {
      source.system.transferOnAttack = source.flags.torgeternity.transferOnAttack;
      delete source.flags.torgeternity.transferOnAttack;
    }
    if (source.flags?.torgeternity?.testOutcome !== undefined) {
      source.system.transferOnOutcome = source.flags.torgeternity.testOutcome;
      delete source.flags.torgeternity.testOutcome;
    }

    return super.migrateData(source);
  }

  /**
   * Our own version, since this.origin might not point to the correct thing.
   */
  get sourceName() {
    if (this.parent instanceof Actor && this.statuses.has('concentrating') && this.origin) {
      return fromUuidSync(this.origin)?.name ?? game.i18n.localize("None");
    }
    if (!this.parent || this.parent instanceof Actor) return game.i18n.localize("None");
    return this.parent.name;
  }

  /**
   * Should this effect be transferred to the target on a successful attack?
   * @param {TestResult} result 
   * @param {Array<String> | undefined} attackTraits array of traits on the actor performing the test
   * @param {Array<String> | undefined} defendTraits array of traits on the target of the test
   */
  appliesToTest(result, attackTraits, defendTraits) {
    return ((this.system.transferOnAttack && result >= TestResult.STANDARD) || (this.system.transferOnOutcome === result)) &&
      testTraits(this.system.applyIfAttackTrait, attackTraits) &&
      testTraits(this.system.applyIfDefendTrait, defendTraits);
  }
}

/**
 * Return true if testTraits contains at least one of the entries in actualTraits
 * @param {Set<String>} testTraits 
 * @param {Array<String>} actualTraits 
 */
function testTraits(testTraits, actualTraits) {
  if (!testTraits?.size) return true;
  for (const trait of testTraits) {
    if (actualTraits.includes(trait)) return true;
  }
  return false;
}