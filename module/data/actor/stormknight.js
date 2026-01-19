import { CommonActorData } from './common.js';
import { torgeternity } from '../../config.js';
import { makeAxiomsField } from '../shared.js';

const fields = foundry.data.fields;

/**
 * class for actor data specific to Storm Knights
 */
export class StormKnightData extends CommonActorData {
  /**
   *
   * @returns {object} Schema for a Storm Knight
   */
  static defineSchema() {
    return {
      ...super.defineSchema(),
      axioms: makeAxiomsField(),
      details: new fields.SchemaField({
        background: new fields.HTMLField({ initial: '', textSearch: true }),
        race: new fields.StringField({ initial: undefined, textSearch: true }),
        sizeBonus: new fields.StringField({
          initial: 'normal',
          choices: Object.keys(torgeternity.sizes),
          required: true,
        }),
      }),
      xp: new fields.SchemaField({
        earned: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
        unspent: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      }),
    };
  }

  /**
   *
   * @param {object} data the data object to migrate
   */
  static migrateData(data) {
    if (data?.details && Object.hasOwn(data?.details, 'race')) {
      data.details.race = Object.keys(torgeternity.races).includes(data.details.race)
        ? data.details.race
        : 'other';
    }
    if (data?.details && Object.hasOwn(data?.details, 'sizeBonus')) {
      data.details.sizeBonus = Object.keys(torgeternity.sizes).includes(data.details.sizeBonus)
        ? data.details.sizeBonus
        : 'normal';
    }
    return super.migrateData(data);
  }

  /**
   * Prepare base data for Storm Knights
   */
  prepareBaseData() {
    super.prepareBaseData();

    // Set axioms based on home reality
    this.axioms.magic = torgeternity.axiomByCosm[this.other.cosm]?.magic || this.axioms.magic;
    this.axioms.social = torgeternity.axiomByCosm[this.other.cosm]?.social || this.axioms.social;
    this.axioms.spirit = torgeternity.axiomByCosm[this.other.cosm]?.spirit || this.axioms.spirit;
    this.axioms.tech = torgeternity.axiomByCosm[this.other.cosm]?.tech || this.axioms.tech;

    // Set clearance level
    if (this.xp.earned < 50) {
      this.details.clearance = 'alpha';
    } else if (this.xp.earned < 200) {
      this.details.clearance = 'beta';
    } else if (this.xp.earned < 500) {
      this.details.clearance = 'gamma';
    } else if (this.xp.earned < 1000) {
      this.details.clearance = 'delta';
    } else {
      this.details.clearance = 'omega';
    }
  }
}
