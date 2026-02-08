import { BaseItemData } from './baseItemData.js';

const fields = foundry.data.fields;

/**
 * @inheritdoc
 */
export class SpecialAbilityRollableItemData extends BaseItemData {
  /**
   * @returns {object} Schema fragment for a special ability
   */
  static defineSchema() {
    return {
      ...super.defineSchema('specialability-rollable'),
      ap: new fields.NumberField({ initial: 0, integer: true }),
      attackWith: new fields.StringField({ initial: 'unarmedCombat' }),
      chatNote: new fields.StringField({ initial: '' }),
      damage: new fields.NumberField({ initial: 0, integer: true }),
    };
  }
}
