import { BaseItemData } from './baseItemData.js';

const fields = foundry.data.fields;

/**
 * @inheritdoc
 * 
 * BaseItemData:
 * cosm
 * description
 * traits
 * axioms
 */
export class CurrencyItemData extends BaseItemData {
  /**
 * @inheritdoc
 */
  static defineSchema() {
    return {
      ...super.defineSchema('currency'),
      quantity: new fields.NumberField({ initial: 0, integer: true }),
    }
  }
}
