import { BaseWeaponItemData } from './baseweapon.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class MeleeWeaponItemData extends BaseWeaponItemData {
  /**
   * @returns {object} Schema fragment for a melee weapon
   */
  static defineSchema(subtype = 'meleeweapon', attackwith = 'meleeWeapons') {
    return super.defineSchema(subtype, attackwith);
  }

  static migrateData(source) {
    if (typeof source.equipped === 'boolean') {
      source.equipped = { carryType: source.equipped ? 'held' : 'stowed' };
      if (source.equipped.carryType === 'held') {
        source.equipped.handsHeld = source.traits?.includes('twoHanded') ? 2 : 1;
      }
    }
    return super.migrateData(source);
  }

  get isEquipped() {
    return super.isEquipped &&
      (!this.traits.has('twoHanded') ||
        this.equipped.handsHeld === 2 ||
        this.parent.parent?.system.attributes?.strength?.value >= 10);
  }
}
