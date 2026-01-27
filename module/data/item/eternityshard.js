import { BaseItemData } from './baseItemData.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class EternityShardItemData extends BaseItemData {
  /**
   * @inheritdoc
   */
  static defineSchema() {
    return {
      ...super.defineSchema('eternityshard'),
      possibilities: new fields.SchemaField({
        max: new fields.NumberField({ initial: 3, integer: true, nullable: false }),
        value: new fields.NumberField({ initial: 3, integer: true, nullable: false }),
      }),
      powers: new fields.StringField({ initial: '' }),
      purpose: new fields.StringField({ initial: '' }),
      restrictions: new fields.StringField({ initial: '' }),
      tappingDifficulty: new fields.NumberField({ initial: 18, integer: true }),
    };
  }

  static migrateData(data) {
    if (Object.hasOwn(data, "possibilities") && typeof data.possibilities === 'number') {
      data.possibilities = {
        value: data.possibilities,
        max: data.possibilities,
      }
    }
    return super.migrateData(data);
  }
}
