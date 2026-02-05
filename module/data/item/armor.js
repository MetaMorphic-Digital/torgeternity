import { GeneralItemData } from './general.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class ArmorItemData extends GeneralItemData {
  /**
   * @inheritdoc
   */
  static defineSchema() {
    return {
      ...super.defineSchema('armor'),
      bonus: new fields.NumberField({ initial: 1, integer: true, nullable: false }),
      equipped: new fields.BooleanField({ initial: false }),
      maxDex: new fields.NumberField({ initial: 12, integer: true, nullable: false }),
      minStrength: new fields.NumberField({ initial: 0, integer: true }),
      notes: new fields.StringField({ initial: '' }),
      fatigue: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
    };
  }
}
