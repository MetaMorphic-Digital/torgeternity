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
      mr: new fields.NumberField({ initial: -1, integer: true }), // maneuver
      pass: new fields.NumberField({ initial: 1, integer: true }), // passengers
      topspeed: new fields.NumberField({ initial: 1, integer: true }),
      tough: new fields.NumberField({ initial: 1, integer: true }),  // toughness
      wounds: new fields.NumberField({ initial: 3, integer: true }),
    };
  }
}
