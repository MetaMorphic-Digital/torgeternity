import { migrateCosm, makeSkillFields } from '../shared.js';
import { torgeternity } from '../../config.js';

const fields = foundry.data.fields;
/**
 * class for shared actor data between Threats and Storm Knights
 */
export class CommonActorData extends foundry.abstract.TypeDataModel {
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
        cosm: new fields.StringField({ initial: 'none', choices: torgeternity.cosmTypes, textSearch: true, required: true, blank: false, nullable: false }),
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
    // register value of attributes so we can work further with this
    for (const attribute of Object.keys(this.attributes)) {
      this.attributes[attribute].value = this.attributes[attribute].base;
    }

    this.shock.max = this.attributes.spirit.value;
    this.other.possibilities.perAct = CONFIG.torgeternity.possibilitiesPerAct;
  }

  /**
   * Prepare derived data for Storm Knights and Threats
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.other.move = this.attributes.dexterity.value;
    this.other.run = this.attributes.dexterity.value * 3;
    // Derive Skill values for Storm Knights and Threats
    for (const [name, skill] of Object.entries(this.skills)) {
      const trained = skill.unskilledUse || this._source.skills[name].adds;
      skill.value = trained ? this.attributes[skill.baseAttribute].value + skill.adds : '';
    }
  }
}
