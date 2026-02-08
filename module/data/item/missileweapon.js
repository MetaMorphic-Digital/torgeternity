import { BaseWeaponItemData } from './baseweapon.js';
import TorgeternityActor from '../../documents/actor/torgeternityActor.js'

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class MissileWeaponItemData extends BaseWeaponItemData {
  /**
   * @returns {object} Schema fragment for a missile weapon
   */
  static defineSchema(subtype = 'missileweapon', attackwith = 'missileWeapons') {
    return {
      ...super.defineSchema(subtype, attackwith),
      range: new fields.StringField({ initial: '' }),  // "10 / 20 / 40"
      ammo: new fields.SchemaField({
        max: new fields.NumberField({ initial: 1, integer: true }),
        value: new fields.NumberField({ initial: 1, integer: true }),  // null = unlimited ammo
      }),
      loadedAmmo: new fields.DocumentIdField({ initial: null }),
      gunner: new fields.ForeignDocumentField(TorgeternityActor),
      gunnerFixedSkill: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
    };
  }

  /**
   * If the item has a gunner, then return the gunner's name and skillValue
   */
  get gunnerSkill() {
    if (this.gunner) {
      const skill = this.gunner.system.skills[this.attackWith]
      const result = skill ? { ...skill } : { value: 0, adds: 0 };
      result.value -= this.gunner.system.wounds.value;
      return result;
    } else {
      return { value: this.gunnerFixedSkill }
    }
  }
}
