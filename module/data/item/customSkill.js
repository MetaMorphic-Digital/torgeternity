import { BaseItemData } from './baseItemData.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class CustomSkillItemData extends BaseItemData {
  /**
   * @inheritdoc
   */
  static defineSchema() {
    return {
      ...super.defineSchema('customSkill'),
      adds: new fields.NumberField({ initial: 1, integer: true }),
      baseAttribute: new fields.StringField({ initial: 'strength', choices: CONFIG.torgeternity.attributeTypes }),
      isFav: new fields.BooleanField({ initial: false }),
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    const actor = this.parent?.parent;
    this.value = this.adds + (this.mod ?? 0);
    if (actor instanceof Actor)
      this.value += (actor.system.attributes[this.baseAttribute]?.value ?? 0);
  }
}
