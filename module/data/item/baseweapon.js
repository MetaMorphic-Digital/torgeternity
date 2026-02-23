import { GeneralItemData } from './general.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class BaseWeaponItemData extends GeneralItemData {
  /**
   * @returns {object} Schema fragment for a melee weapon
   */
  static defineSchema(weapontype, attackWith) {
    return {
      ...super.defineSchema(weapontype),
      ap: new fields.NumberField({ initial: 0, integer: true }),
      attackWith: new fields.StringField({ initial: attackWith }),
      bonus: new fields.NumberField({ initial: 2, integer: true }),
      chatNote: new fields.StringField({ initial: '' }),
      damage: new fields.NumberField({ initial: 0, integer: true }),
      damageType: new fields.StringField({ initial: '' }),
      minStrength: new fields.NumberField({ initial: null, integer: true }),
      notes: new fields.StringField({ initial: '' }),
    };
  }
}
