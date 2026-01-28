import { CommonActorData } from './common.js';
import { torgeternity } from '../../config.js';

const fields = foundry.data.fields;

/**
 * class for actor data specific to Threats
 */
export class ThreatData extends CommonActorData {
  /**
   *
   * @returns {object} Schema for a Threat
   */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      details: new fields.SchemaField({
        description: new fields.HTMLField({ initial: '', textSearch: true }),
        sizeBonus: new fields.StringField({
          initial: 'normal',
          choices: Object.keys(torgeternity.sizes),
          required: true,
        }),
        clearance: new fields.StringField({
          initial: 'alpha',
          choices: Object.keys(torgeternity.clearances),
          required: false,
          textSearch: true
        }),
        possibilityPotential: new fields.StringField({
          initial: 'Never',
          required: true,
          blank: false,
        }),
      }),
    };
  }

  /**
   *
   * @param {object} source the partial data object to migrate
   */
  static migrateData(source) {
    if (source?.details && Object.hasOwn(source?.details, 'possibilitypotential')) {
      source.details.possibilityPotential ??= 'Never';
    }
    if (source?.details && Object.hasOwn(source?.details, 'sizeBonus')) {
      source.details.sizeBonus = Object.keys(torgeternity.sizes).includes(source.details.sizeBonus)
        ? source.details.sizeBonus
        : 'normal';
    }
    return super.migrateData(source);
  }

  /**
   * Prepare derived data for Threats
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    for (const skill of Object.values(this.skills)) {
      skill.isThreatSkill = skill.isThreatSkill || skill.adds !== 0;
    }
  }
}
