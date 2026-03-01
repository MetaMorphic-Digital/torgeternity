import { PerkItemData } from './perk.js';
import { CustomAttackItemData } from './customAttack.js';
import { BaseItemData } from './baseItemData.js';

const fields = foundry.data.fields;

/**
 * @inheritdoc
 */
export class RaceItemData extends BaseItemData {
  /** @inheritdoc */
  static defineSchema() {
    return {
      ...super.defineSchema('race'),
      name: new fields.StringField({ initial: '' }), // TODO
      attributeMaximum: new fields.SchemaField({
        charisma: new fields.NumberField({ initial: 13, integer: true, nullable: false }),
        dexterity: new fields.NumberField({ initial: 13, integer: true, nullable: false }),
        mind: new fields.NumberField({ initial: 13, integer: true, nullable: false }),
        spirit: new fields.NumberField({ initial: 13, integer: true, nullable: false }),
        strength: new fields.NumberField({ initial: 13, integer: true, nullable: false }),
      }),
      size: new fields.StringField({
        initial: 'normal',
        choices: Object.keys(CONFIG.torgeternity.sizes),
        required: true,
      }),
      darkvision: new fields.BooleanField({ initial: false }),
      perksData: new fields.SetField(new fields.TypeDataField({ document: PerkItemData })),
      customAttackData: new fields.SetField(new fields.TypeDataField({ document: CustomAttackItemData })
      ),
    };
  }
}
