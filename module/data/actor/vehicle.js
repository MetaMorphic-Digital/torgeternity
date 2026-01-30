import { torgeternity } from '../../config.js';
import { getTorgValue } from '../../torgchecks.js';
import TorgeternityActor from '../../documents/actor/torgeternityActor.js'
import { calcPriceValue } from '../shared.js';

const fields = foundry.data.fields;
/**
 * class for shared actor data between Threats and Storm Knights
 */
export class VehicleData extends foundry.abstract.TypeDataModel {
  /**
   *
   * @returns {object} Schema fragment for a Storm Knight or Threat
   */
  static defineSchema() {
    return {
      details: new fields.SchemaField({
        sizeBonus: new fields.StringField({
          initial: 'normal',
          choices: Object.keys(torgeternity.sizes),
          required: true,
        }),
      }),
      armor: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      axioms: new fields.SchemaField({
        magic: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
        social: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
        spirit: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
        tech: new fields.NumberField({ initial: 10, integer: true, nullable: false }),
      }),
      description: new fields.HTMLField({ initial: '', textSearch: true }),
      maneuver: new fields.NumberField({ initial: -1, integer: true, nullable: false }),
      operator: new fields.ForeignDocumentField(TorgeternityActor),
      operatorFixedSkill: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      passengers: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
      price: new fields.SchemaField({
        dollars: new fields.StringField({ initial: '', nullable: false }),
        // will receive price.torgValue during prepareDerivedData
      }),
      topSpeed: new fields.SchemaField({
        kph: new fields.NumberField({ initial: 100, integer: true, nullable: false }),
      }),
      toughness: new fields.NumberField({ initial: 5, integer: true, nullable: false }),
      type: new fields.StringField({ initial: 'land', textSearch: true }),
      wounds: new fields.SchemaField({
        value: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
        max: new fields.NumberField({ initial: 3, integer: true, nullable: false }),
      }),
    };
  }

  /**
   *
   * @param {object} source the data object to migrate
   */
  static migrateData(source) {
    if (source?.details && Object.hasOwn(source?.details, 'sizeBonus')) {
      source.details.sizeBonus = Object.keys(torgeternity.sizes).includes(source.details.sizeBonus)
        ? source.details.sizeBonus
        : 'normal';
    }
    if (source?.price && Object.hasOwn(source?.price, 'magnitude')) {
      source.price.dollars = String(source.price.dollars);
      if (source.price.magnitude !== 'ones' && Object.keys(torgeternity.magnitudes).includes(source.price.magnitude))
        source.price.dollars += CONFIG.torgeternity.magnitudeLabels[source.price.magnitude];
      delete source.price.magnitude;
    }
    if (source?.wounds && Object.hasOwn(source?.wounds, 'current')) {
      source.wounds.value = source.wounds.current;
    }
    return super.migrateData(source);
  }

  /**
   * Prepare derived data for Storm Knights and Threats
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.price.torgValue = calcPriceValue(String(this.price.dollars));

    const speedValue = getTorgValue(this.topSpeed.kph) + 2;
    this.topSpeed.value = speedValue;
    let speedPenalty = 0;
    if (speedValue < 11) {
      speedPenalty = 0;
    } else if (speedValue < 15) {
      speedPenalty = -2;
    } else if (speedValue < 17) {
      speedPenalty = -4;
    } else {
      speedPenalty = -6;
    }
    this.topSpeed.penalty = speedPenalty;
  }

  get operatorSkill() {
    if (this.operator) {
      const skill = this.operator.system.skills[this.type.toLowerCase() + 'Vehicles'];
      const result = skill ? { ...skill } : { value: 0, adds: 0 };
      result.value -= this.operator.system.wounds.value;
      return result;
    } else
      return { value: this.operatorFixedSkill };
  }

  get defense() {
    return (this.operatorSkill.value ?? 0) + parseInt(this.maneuver);
  }
}