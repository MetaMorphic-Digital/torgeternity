import { GeneralItemData } from './general.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class ShieldItemData extends GeneralItemData {
  /**
   * @returns {object} Schema fragment for a shield
   */
  static defineSchema() {
    return {
      ...super.defineSchema('shield'),
      bonus: new fields.NumberField({ initial: 1, integer: true, nullable: false }),
      equipped: new fields.BooleanField({ initial: false }),
      minStrength: new fields.NumberField({ initial: 0, integer: true }),
      notes: new fields.StringField({ initial: '' }),
    };
  }
}
