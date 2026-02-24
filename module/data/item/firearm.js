import { MissileWeaponItemData } from './missileweapon.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class FirearmItemData extends MissileWeaponItemData {
  /**
   * @returns {object} Schema fragment for a firearm
   */
  static defineSchema(subtype = 'firearm', attackwith = 'fireCombat') {
    return MissileWeaponItemData.defineSchema(subtype, attackwith);
  }

  static migrateData(source) {
    if (typeof source.equipped === 'boolean') {
      source.equipped = { carryType: source.equipped ? 'held' : 'stowed' };
      if (source.equipped.carryType === 'held') {
        source.equipped.handsHeld = (source.traits?.includes('pistol') || source.traits?.includes('carbine')) ? 1 : 2;
      }
    }
    return super.migrateData(source);
  }

  get isEquipped() {
    return super.isEquipped &&
      (this.traits.has('pistol') || this.traits.has('carbine') ||
        this.equipped.handsHeld === 2);
  }
}
