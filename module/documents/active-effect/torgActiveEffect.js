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
      const needSystemPrefix = [
        'statusModifiers.',
        'targetModifiers.',
        'defenses.',
        'unarmed.',
      ];
      const migrationDictionary = {
        // SK and Threat attribute modifiers
        'system.attributes.charisma': 'system.attributes.charisma.value',
        'system.attributes.mind': 'system.attributes.mind.value',
        'system.attributes.strength': 'system.attributes.strength.value',
        'system.attributes.dexterity': 'system.attributes.dexterity.value',
        'system.attributes.spirit': 'system.attributes.spirit.value',
        // SK and Threat general path cleaning
        'system.other.fatigue': 'system.fatigue',
        'fatigue': 'system.fatigue',
        'system.unarmedDamage': 'system.skills.unarmedCombat.damageMod',
        'system.unarmedDamageMod': 'system.skills.unarmedCombat.damageMod',
        'system.unarmed.damageMod': 'system.skills.unarmedCombat.damageMod',
        // SK and Threat defense modifiers
        'system.dodgeDefenseMod': 'system.defenses.dodge.mod',
        'system.meleeWeaponsDefenseMod': 'system.defenses.meleeWeapons.mod',
        'system.unarmedCombatDefenseMod': 'system.defenses.unarmedCombat.mod',
        'system.intimidationDefenseMod': 'system.defenses.intimidation.mod',
        'system.maneuverDefenseMod': 'system.defenses.maneuver.mod',
        'system.tauntDefenseMod': 'system.defenses.taunt.mod',
        'system.trickDefenseMod': 'system.defenses.trick.mod',
        // SK and Threat armor and toughness
        'system.other.armor': 'system.defenses.armor',
        'system.other.toughness': 'system.defenses.toughness',
        // Vehicle armor and toughness
        'system.armor': 'system.defenses.armor',
        'system.toughness': 'system.defenses.toughness',
        // modify maxDex and minStr
        'system.maxDex': 'system.other.maxDex',
        'system.minStr': 'system.other.minStr',
        'system.attributes.minStr': 'system.other.minStr',
        'system.attributes.maxDex': 'system.other.maxDex',
        'system.other.possibilities': 'system.other.possibilities.perAct',
      };
      for (const change of source.changes) {
        if (needSystemPrefix.find(prefix => change.key.startsWith(prefix)))
          change.key = `system.${change.key}`;
        else if (Object.hasOwn(migrationDictionary, change.key))
          change.key = migrationDictionary[change.key];
        else if (change.key.endsWith('IsFav'))
          change.key = change.key.replace(/IsFav$/, '.isFav');
      }
      for (const change of source.changes) {
        if (change.key.endsWith('.isFav')) {
          change.value = (change.value === '1' || change.value === 'True' || change.value === 'true') ? 'true' : 'false'
        }
      }
    }

    // Replace flags
    if (source.flags?.torgeternity) {
      if (source.flags.torgeternity.testOutcome) {
        source.system.transferOnOutcome = source.flags.torgeternity.testOutcome;
        delete source.flags.torgeternity.testOutcome;
      }
      if (source.flags.torgeternity.transferOnAttack === true) {
        source.system.transferOnAttack = source.flags.torgeternity.transferOnAttack;
        delete source.flags.torgeternity.transferOnAttack;
      }
    }

    return super.migrateData(source);
  }

  /**
   * Foundry V14 requires start.combatant to point to THIS token's combatant
   * and start.turn to be null (to prevent counting individual player turns)
   * 
   * @inheritdoc
   */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    if (game.release.generation >= 14) {
      const combatant = game.combat.getCombatantsByActor(this.actor ?? "")?.[0];
      this.updateSource({
        start: {
          combatant: combatant?.id ?? null,
          turn: null,
        }
      })
    }
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
   * Return if this effect modifies the target of the test rather than the owner of the AE.
   * @type {boolean}
   */
  get transfersToTarget() {
    return !this.disabled && this.system.transferOnOutcome && this.system.transferTo === 'target';
  }

  get transfersToActor() {
    return !this.disabled && this.system.transferOnOutcome && this.system.transferTo === 'actor';
  }

  /**
   * Return a copy of this object with the various "attack" traits cleared.
   */
  copyForTransfer(concentratingId) {
    // Override some values
    return foundry.utils.mergeObject(this.toObject(),
      {
        disabled: false,
        system: {
          transferOnOutcome: null,
          transferTo: '',
          concentratingId: concentratingId
        },
        origin: this.parent.uuid,  // the originating Item
      },
      { replace: true, recursive: true });
  }

  /**
   * Foundry 14: 
   * Don't allow core Foundry to trigger turnEnd events.
   */
  isExpiryEvent(event, context) {
    if (event === 'turnEnd') return false;
    return super.isExpiryEvent(event, context);
  }

}