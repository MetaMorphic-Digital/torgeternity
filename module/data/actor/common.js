import { migrateCosm, makeSkillFields } from '../shared.js';
import { BaseActorData } from './base.js';

const fields = foundry.data.fields;
/**
 * class for shared actor data between Threats and Storm Knights
 */
export class CommonActorData extends BaseActorData {
  /**
   *
   * @returns {object} Schema fragment for a Storm Knight or Threat
   */
  static defineSchema() {
    return {
      attributes: new fields.SchemaField({
        charisma: new fields.SchemaField({
          base: new fields.NumberField({ initial: 8, integer: true, nullable: false }), // base: The base attribute what is raised with ep and such
        }),
        dexterity: new fields.SchemaField({
          base: new fields.NumberField({ initial: 8, integer: true, nullable: false }),
        }),
        mind: new fields.SchemaField({
          base: new fields.NumberField({ initial: 8, integer: true, nullable: false }),
        }),
        spirit: new fields.SchemaField({
          base: new fields.NumberField({ initial: 8, integer: true, nullable: false }),
        }),
        strength: new fields.SchemaField({
          base: new fields.NumberField({ initial: 8, integer: true, nullable: false }),
        }),
      }),
      other: new fields.SchemaField({
        cosm: new fields.StringField({ initial: 'none', choices: CONFIG.torgeternity.cosmTypes, textSearch: true, required: true, blank: false, nullable: false }),
        possibilities: new fields.SchemaField({
          value: new fields.NumberField({ initial: 3, integer: true, nullable: false }),
          // perAct is a derived value, modifiable by Active Effects
        }),
        piety: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      }),
      shock: new fields.SchemaField({
        max: new fields.NumberField({ initial: 8, integer: true }),
        value: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      }),
      skills: new fields.SchemaField({
        airVehicles: makeSkillFields(false, 'dexterity', 'other'),
        alteration: makeSkillFields(false, 'mind', 'other'),
        apportation: makeSkillFields(false, 'spirit', 'other'),
        beastRiding: makeSkillFields(true, 'dexterity', 'other'),
        computers: makeSkillFields(true, 'mind', 'other'),
        conjuration: makeSkillFields(false, 'spirit', 'other'),
        divination: makeSkillFields(false, 'mind', 'other'),
        dodge: makeSkillFields(true, 'dexterity', 'other'),
        energyWeapons: makeSkillFields(true, 'dexterity', 'combat'),
        evidenceAnalysis: makeSkillFields(true, 'mind', 'other'),
        faith: makeSkillFields(true, 'spirit', 'other'),
        find: makeSkillFields(true, 'mind', 'other'),
        fireCombat: makeSkillFields(true, 'dexterity', 'combat'),
        firstAid: makeSkillFields(true, 'mind', 'other'),
        heavyWeapons: makeSkillFields(true, 'dexterity', 'combat'),
        intimidation: makeSkillFields(true, 'spirit', 'interaction'),
        kinesis: makeSkillFields(false, 'spirit', 'other'),
        landVehicles: makeSkillFields(true, 'dexterity', 'other'),
        language: makeSkillFields(false, 'mind', 'other'),
        lockpicking: makeSkillFields(false, 'dexterity', 'other'),
        maneuver: makeSkillFields(true, 'dexterity', 'interaction'),
        medicine: makeSkillFields(false, 'mind', 'other'),
        meleeWeapons: makeSkillFields(true, 'dexterity', 'combat'),
        missileWeapons: makeSkillFields(true, 'dexterity', 'combat'),
        persuasion: makeSkillFields(true, 'charisma', 'other'),
        precognition: makeSkillFields(false, 'mind', 'other'),
        profession: makeSkillFields(true, 'mind', 'other'),
        reality: makeSkillFields(false, 'spirit', 'other'),
        scholar: makeSkillFields(true, 'mind', 'other'),
        science: makeSkillFields(true, 'mind', 'other'),
        stealth: makeSkillFields(true, 'dexterity', 'other'),
        streetwise: makeSkillFields(true, 'charisma', 'other'),
        survival: makeSkillFields(true, 'mind', 'other'),
        taunt: makeSkillFields(true, 'charisma', 'interaction'),
        telepathy: makeSkillFields(false, 'charisma', 'other'),
        tracking: makeSkillFields(true, 'mind', 'other'),
        trick: makeSkillFields(true, 'mind', 'interaction'),
        unarmedCombat: makeSkillFields(true, 'dexterity', 'combat'),
        waterVehicles: makeSkillFields(true, 'dexterity', 'other'),
        willpower: makeSkillFields(true, 'spirit', 'other'),
      }),
      wounds: new fields.SchemaField({
        max: new fields.NumberField({ initial: 3, integer: true }),
        value: new fields.NumberField({ initial: 0, integer: true }),
      }),
      editstate: new fields.BooleanField({ initial: true }),
    };
  }

  /**
   *
   * @param {object} source the data object to migrate
   */
  static migrateData(source) {
    if (source.other?.cosm !== undefined) source.other.cosm = migrateCosm(source.other.cosm);

    for (const attribute of Object.keys(source.attributes ?? {})) {
      if (typeof source?.attributes?.[attribute] === 'number') {
        source.attributes[attribute] = { base: source.attributes[attribute] };
      }
    }

    for (const skill of Object.values(source.skills ?? {})) {
      if (Object.hasOwn(skill, 'adds') && typeof skill.adds !== 'number') {
        let skillAdd = parseInt(skill.adds);
        skillAdd = isNaN(skillAdd) ? 0 : skillAdd;
        skill.adds = skillAdd;
      }
      if (Object.hasOwn(skill, 'unskilledUse') && typeof skill.unskilledUse === 'number') {
        skill.unskilledUse = (skill.unskilledUse === 1);
      }
    }

    if (source?.other && Object.hasOwn(source.other, "possibilities") && typeof source.other.possibilities === 'number') {
      source.other.possibilities = { value: source.other.possibilities }
    }
    return super.migrateData(source);
  }

  /**
   * Prepare base data for Storm Knights and Threats
   */
  prepareBaseData() {
    super.prepareBaseData();
    const actor = this.parent;

    // register value of attributes so we can work further with this
    for (const attribute of Object.keys(this.attributes)) {
      this.attributes[attribute].value = this.attributes[attribute].base;
    }
    for (const [_name, skill] of Object.entries(this.skills)) {
      skill.mod = 0;
    }

    this.shock.max = this.attributes.spirit.value;
    this.other.possibilities.perAct = CONFIG.torgeternity.possibilitiesPerAct;
    this.other.inspiration = CONFIG.torgeternity.shockPerInspiration;

    // initialize the worn armor and shield bonus
    const wornArmor = actor.itemTypes.armor.find((a) => a.isEquipped);
    const heldShield = actor.itemTypes.shield.find((a) => a.isEquipped);
    const shieldBonus = heldShield?.system?.bonus ?? 0;

    this.fatigue = 2 + (wornArmor?.system?.fatigue ?? 0);
    this.other.maxDex = wornArmor?.system?.maxDex ?? 0;
    const highestMinStrWeapons = Math.max(...actor.equippedMelees?.map((m) => m.system.minStrength)) ?? 0;
    this.other.minStr = Math.max(
      wornArmor?.system?.minStrength ?? 0,
      heldShield?.system?.minStrength ?? 0,
      highestMinStrWeapons);

    // TODO: If we allow more than 1 wornArmor and an array is to be expected, then we need to change that here.
    // 'value' of each field is set in prepareDerivedData
    Object.assign(this.defenses, {
      dodge: { value: 0, mod: shieldBonus },
      meleeWeapons: { value: 0, mod: shieldBonus },
      unarmedCombat: { value: 0, mod: 0 },
      intimidation: { value: 0, mod: 0 },
      maneuver: { value: 0, mod: 0 },
      taunt: { value: 0, mod: 0 },
      trick: { value: 0, mod: 0 },
      toughness: this.attributes.strength.value,
      armor: wornArmor?.system?.bonus ?? 0,
      shield: shieldBonus
    });
    this.unarmed = { damage: 0, damageMod: 0 };
  }

  /**
   * Prepare derived data for Storm Knights and Threats
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    const actor = this.parent;

    const skills = this.skills;
    const attributes = this.attributes;
    // by RAW, FIRST you checkout for maxDex, THEN minStr. Doing this into DerivedData means, it takes place after AE's were applied, making sure, this cannot get higher than armor's limitations.
    // only apply if a maxDex value is set
    attributes.dexterity.value =
      this.other.maxDex > 0
        ? Math.min(attributes.dexterity.value, this.other.maxDex)
        : attributes.dexterity.value;
    attributes.dexterity.value += Math.min(0, attributes.strength.value - this.other.minStr);

    // Set base unarmed damage

    this.unarmed.damage = attributes.strength.value + this.unarmed.damageMod;

    // calculate final toughness
    this.defenses.toughness += this.defenses.armor;

    // Set Defensive Values based on modified skills and attributes

    const dodgeDefenseSkill = skills.dodge.value || attributes.dexterity.value;
    this.defenses.dodge.value = dodgeDefenseSkill + this.defenses.dodge.mod;

    const meleeWeaponsDefenseSkill = skills.meleeWeapons.value || attributes.dexterity.value;
    this.defenses.meleeWeapons.value = meleeWeaponsDefenseSkill + this.defenses.meleeWeapons.mod;
    // (Core pg 126) Wielding TWO melee weapons increases melee weapons defense by 2.
    if (this.type !== 'vehicle' && this.equippedMelees?.length > 1)
      this.defenses.meleeWeapons.value += 2;

    const unarmedCombatDefenseSkill = skills.unarmedCombat.value || attributes.dexterity.value;
    this.defenses.unarmedCombat.value = unarmedCombatDefenseSkill + this.defenses.unarmedCombat.mod;

    const intimidationDefenseSkill = skills.intimidation.value || attributes.spirit.value;
    this.defenses.intimidation.value = intimidationDefenseSkill + this.defenses.intimidation.mod;

    const maneuverDefenseSkill = skills.maneuver.value || attributes.dexterity.value;
    this.defenses.maneuver.value = maneuverDefenseSkill + this.defenses.maneuver.mod;

    const tauntDefenseSkill = skills.taunt.value || attributes.charisma.value;
    this.defenses.taunt.value = tauntDefenseSkill + this.defenses.taunt.mod;

    const trickDefenseSkill = skills.trick.value || attributes.mind.value;
    this.defenses.trick.value = trickDefenseSkill + this.defenses.trick.mod;

    const listMove = [];
    let computeMove = this.attributes.dexterity.value;
    actor.appliedEffects.forEach((ef) =>
      ef.changes.forEach((k) => { if (k.key === 'system.other.moveMod') listMove.push(k); })
    );
    // Modify +/-
    listMove
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.ADD)
      .forEach((ef) => { computeMove += parseInt(ef.value); });
    // Modify x
    listMove
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.MULTIPLY)
      .forEach((ef) => { computeMove = parseInt(computeMove * ef.value); });
    // Modify minimum
    listMove
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE)
      .forEach((ef) => { computeMove = Math.max(computeMove, parseInt(ef.value)); });
    // Modify maximum
    listMove
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.DOWNGRADE)
      .forEach((ef) => { computeMove = Math.min(computeMove, parseInt(ef.value)); });
    // Modify Fixed
    listMove
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE)
      .forEach((ef) => { computeMove = parseInt(ef.value); });
    this.other.move = computeMove;
    //
    // Apply the runMod effect
    const listRun = [];
    let computeRun = this.attributes.dexterity.value * 3;  // NOT this.other.move * 3 (pg 114)
    actor.appliedEffects.forEach((ef) =>
      ef.changes.forEach((k) => { if (k.key === 'system.other.runMod') listRun.push(k); })
    );
    // Modify +/-
    listRun
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.ADD)
      .forEach((ef) => { computeRun += parseInt(ef.value); });
    // Modify x
    listRun
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.MULTIPLY)
      .forEach((ef) => { computeRun = parseInt(computeRun * ef.value); });
    // Modify minimum
    listRun
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE)
      .forEach((ef) => { computeRun = Math.max(computeRun, parseInt(ef.value)); });
    // Modify maximum
    listRun
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.DOWNGRADE)
      .forEach((ef) => { computeRun = Math.min(computeRun, parseInt(ef.value)); });
    // Modify Fixed
    listRun
      .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE)
      .forEach((ef) => { computeRun = parseInt(ef.value); });
    this.other.run = computeRun;

    // Derive Skill values for Storm Knights and Threats
    for (const [name, skill] of Object.entries(this.skills)) {
      const trained = skill.unskilledUse || this._source.skills[name].adds;
      skill.value = trained ? this.attributes[skill.baseAttribute].value + skill.adds + (skill.mod ?? 0) : '';
    }
  }
}
