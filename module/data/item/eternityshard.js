import { GeneralItemData } from './general.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class EternityShardItemData extends GeneralItemData {
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

  static migrateData(source) {
    if (Object.hasOwn(source, "possibilities") && typeof source.possibilities === 'number') {
      source.possibilities = {
        value: source.possibilities,
        max: source.possibilities,
      }
    }
    return super.migrateData(source);
  }
}
