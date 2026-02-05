import { GeneralItemData } from './general.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class VehicleItemData extends GeneralItemData {
  /**
   * @returns {object} Schema fragment for a vehicle
   */
  static defineSchema() {
    return {
      ...super.defineSchema('vehicle'),
      mr: new fields.NumberField({ initial: -1, integer: true, nullable: false }), // maneuver
      pass: new fields.NumberField({ initial: 1, integer: true, nullable: false }), // passengers
      topspeed: new fields.NumberField({ initial: 1, integer: true, nullable: false }),
      tough: new fields.NumberField({ initial: 1, integer: true, nullable: false }),  // toughness
      wounds: new fields.NumberField({ initial: 3, integer: true, nullable: false }),
    };
  }
}
