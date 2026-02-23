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
      bonus: new fields.NumberField({ initial: 1, integer: true }),
      maxDex: new fields.NumberField({ initial: 12, integer: true }),
      minStrength: new fields.NumberField({ initial: 0, integer: true }),
      notes: new fields.StringField({ initial: '' }),
      fatigue: new fields.NumberField({ initial: 0, integer: true }),
    };
  }

  static migrateData(source) {
    if (typeof source.equipped === 'boolean') {
      source.equipped = { carryType: source.equipped ? 'worn' : 'stowed' };
    }
    return super.migrateData(source);
  }

  get usage() {
    return 'worn';
  }
}
