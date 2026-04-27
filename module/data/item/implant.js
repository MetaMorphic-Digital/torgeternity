import { GeneralItemData } from './general.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class ImplantItemData extends GeneralItemData {
  /**
   * @returns {object} Schema fragment for an implant
   */
  static defineSchema() {
    return {
      ...super.defineSchema('implant'),
      notes: new fields.StringField({ initial: '' }),
      implantType: new fields.StringField({ initial: _loc('torgeternity.perkTypes.cyberware') })
    };
  }
}