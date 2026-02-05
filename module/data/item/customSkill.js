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
    if (actor instanceof Actor) {
      this.value = this.adds + (actor.system.attributes[this.baseAttribute]?.value ?? 0);
    } else {
      this.value = this.adds;
    }
  }
}
