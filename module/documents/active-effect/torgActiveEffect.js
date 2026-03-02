import { TestResult } from '../../torgchecks.js';
import { torgeternity as config} from '../../config.js';

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
    console.log("Migrating Data", source)
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
      // Assign to each changes a randomID as the default schema for those doesn't yield one
      for(const change of source.changes){
        change._id = foundry.utils.randomID()
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

    // No changes made to systemField or changes, we can safely return the
    // parent migration
    if(!source.system && !source.changes){
      return super.migrateData(source)
    }
    // Changes made on systemField or Changes, if no changes, let's init it
    if(!source.changes){
      source.changes = []
    }
    // Reassign system attributes, attribute, defenses and others to comprehensible foundry changes
    if(source.system?.skillsFavor && source.changes !== undefined){
      const changesToUpdate = source.changes.filter((c) => (c.key.includes('skills') && c.key.includes('.isFav')) ? false : true)
      source.system.skillsFavor.forEach((sf) => {
        const changeAlreadyExists = changesToUpdate.find(c => c.key.includes(sf)) 
        if(!changeAlreadyExists){
          changesToUpdate.push({
            key:'system.skills.'+sf.replace('skillFavor.', '')+'.isFav',
            value: 'true',
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            _id: foundry.utils.randomID()        
          })
        }
      })
      source.changes = changesToUpdate
    }
    
    if(source.system?.skillsAdds && source.changes !== undefined){
      const changesToUpdate = source.changes.filter((c) => (c.key.includes('skills') && !c.key.includes('.isFav')) ? false : true)
      source.system.skillsAdds.forEach((sa) => {
        const changeExists = changesToUpdate.find((c) => c._id === sa._id)
        if(!changeExists){
          changesToUpdate.push({...sa, _id: foundry.utils.randomID()})
        }
      })
      source.changes = changesToUpdate
    }

    if(source.system?.attributesFavor && source.changes !== undefined){
      const changesToUpdate = source.changes.filter((c) => (c.key.includes('attributes') && c.key.includes('IsFav')) ? false : true)
      source.system.attributesFavor.forEach((af) => {
        const changeAlreadyExists = changesToUpdate.find(c => c.key.includes(af)) 
        if(!changeAlreadyExists){
          changesToUpdate.push({
            key:'system.attributes.'+af.replace('attrFavor.', '')+'IsFav',
            value: 'true',
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            _id: foundry.utils.randomID()        
          })
        }
      })
      source.changes = changesToUpdate
    }
    
    if(source.system?.attributesAdds && source.changes !== undefined){
      const changesToUpdate = source.changes.filter((c) => (c.key.includes('attributes') && !c.key.includes('IsFav')) ? false : true)
      source.system.attributesAdds.forEach((aa) => {
        const changeExists = changesToUpdate.find((c) => c._id === aa._id)
        if(!changeExists){
          changesToUpdate.push({...aa, _id: foundry.utils.randomID()})
        }
      })
      source.changes = changesToUpdate
    }

    if(source.system?.defensesChanges && source.changes !== undefined){
      const changesToUpdate = source.changes.filter((c) => (c.key.includes('defenses') && !c.key.includes('damageTraits')) ? false : true)
      source.system.defensesChanges.forEach((dc) => {
        const changeExists = changesToUpdate.find((c) => c._id === dc._id)
        if(!changeExists){
          changesToUpdate.push({...dc, _id: foundry.utils.randomID()})
        }
      })
      source.changes = changesToUpdate
    }

    if(source.system?.elementalDefenses && source.changes !== undefined){
      const changesToUpdate = source.changes.filter((c) => (c.key.includes('defenses') && c.key.includes('damageTraits')) ? false : true)
      source.system.elementalDefenses.forEach((ed) => {
        const changeExists = changesToUpdate.find((c) => c._id === ed._id)
        if(!changeExists){
          changesToUpdate.push({...ed, _id: foundry.utils.randomID()})
        }
      })
      source.changes = changesToUpdate
    }
    // Reassign changes to system skills, attribute, defenses and other to ensure
    // backward compatibility an UI stay compatible
    if(source.changes !== undefined){
      const changesPerType = source.changes?.reduce((changesPerType, change) => {
        if(change.key.includes('skills') && change.key.includes('isFav')){
          changesPerType.skillsFavor.push(change.key.replace('system.skills.', 'skillFavor.').replace('.isFav', ''))
          return changesPerType
        }
        if(change.key.includes('attributes') && change.key.includes('IsFav')){
          changesPerType.attributesFavor.push(change.key.replace('system.attributes.', 'attrFavor.').replace('IsFav', ''))
          console.log(changesPerType)
          return changesPerType
        }
        if(change.key.includes('skills') && !change.key.includes('isFav')){
          changesPerType.skillsAdds.push(change)
          return changesPerType
        }
        if(change.key.includes('attributes') && !change.key.includes('IsFav')){
          changesPerType.attributesAdds.push(change)
          return changesPerType
        }
        if(change.key.includes('defenses') && !change.key.includes('damageTraits')){
          changesPerType.defensesChanges.push(change)
          return changesPerType
        }
        if(change.key.includes('defenses') && change.key.includes('damageTraits')){
          changesPerType.elementalDefenses.push(change)
          return changesPerType
        }
        if(change.key.includes('other')){
          changesPerType.otherChanges.push(change)
          return changesPerType
        }
        return changesPerType
      }, {
        skillsAdds:[],
        skillsFavor:[],
        attributesAdds:[],
        attributesFavor:[],
        defensesChanges:[],
        elementalDefenses:[],
        otherChanges:[]
      })
      // Reassign for UI
      source.system = {
        ...(source.system ??{}), // Keep other fields change not manage by migration (attackTraits, etc.)
        skillsAdds : changesPerType.skillsAdds ?? [],
        skillsFavor : changesPerType.skillsFavor ?? [],
        attributesAdds : changesPerType.attributesAdds ?? [],
        attributesFavor : changesPerType.attributesFavor ?? [],
        defensesChanges : changesPerType.defensesChanges ?? [],
        elementalDefenses: changesPerType.elementalDefenses ?? [],
        otherChanges : changesPerType.otherChanges ?? [],
      }
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
    return (!this.disabled &&
      (this.system.transferOnAttack && result >= TestResult.STANDARD) || (this.system.transferOnOutcome === result)) &&
      testTraits(this.system.applyIfAttackTrait, attackTraits) &&
      testTraits(this.system.applyIfDefendTrait, defendTraits);
  }

  /**
   * Return if this effect has at least one change which is not merely changing the test.
   * @type {boolean}
   */
  get modifiesTarget() {
    return !this.disabled &&
      (this.system.transferOnAttack || this.system.transferOnOutcome) &&
      (this.changes.find(change => !change.key.startsWith('test.')) || this.statuses.length !== 0);
  }
  static blank;

  /**
   * Return a copy of this object with the various "attack" traits cleared,
   * and any 'test.*' changes removed from it.
   */
  copyForTarget() {
    if (!this.blank) this.blank = new TorgActiveEffect({ name: "blank" });

    let fx = this.toObject();
    fx.changes = fx.changes.filter(change => !change.key.startsWith('test.'));
    return Object.assign(fx, {
      disabled: false,
      system: this.blank.system,
      origin: this.parent.uuid,
    });
  }
}

/**
 * Return true if testTraits contains at least one of the entries in actualTraits
 * @param {Set<String>} testTraits 
 * @param {Array<String>} actualTraits 
 */
function testTraits(testTraits, actualTraits) {
  if (!testTraits?.size) return true;
  if (!actualTraits?.length) return false;
  for (const trait of testTraits) {
    if (actualTraits.includes(trait)) return true;
  }
  return false;
}