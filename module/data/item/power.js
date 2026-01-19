import { torgeternity } from '../../config.js';
import { BaseItemData } from './baseItemData.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class PowerItemData extends BaseItemData {
  /**
   * @inheritdoc
   */
  static defineSchema() {
    return {
      ...super.defineSchema('power'),
      ap: new fields.NumberField({ initial: 0, integer: true }),
      applyArmor: new fields.BooleanField({ initial: true }),
      applySize: new fields.BooleanField({ initial: true }),
      //axiom: new fields.NumberField({ initial: 0, integer: true }),
      castingtime: new fields.StringField({ initial: '' }),
      damage: new fields.NumberField({ initial: 0, integer: true }),
      dn: new fields.StringField({ initial: '' }),
      dnType: new fields.StringField({ initial: '' }),
      duration: new fields.StringField({ initial: '' }),
      good: new fields.HTMLField({ initial: '', textSearch: true }),
      isAttack: new fields.BooleanField({ initial: false }),
      modifier: new fields.NumberField({ integer: true }),
      outstanding: new fields.HTMLField({ initial: '', textSearch: true }),
      range: new fields.StringField({ initial: '' }),
      requiresConcentration: new fields.BooleanField({ initial: false }),
      skill: new fields.StringField({ initial: '' }),
      skilllevel: new fields.StringField({ initial: '' }),
      targetDefense: new fields.StringField({ initial: '' }),
    };
  }

  /**
   * @inheritdoc
   */
  prepareBaseData() {
    super.prepareBaseData();

    if (this?.dn.length > 0 && this?.dnType.length === 0) {
      for (const [key, value] of Object.entries(torgeternity.dnTypes)) {
        if (key === this?.dn) {
          this.dnType = game.i18n.localize(value);
          break;
        }
      }
    }
  }
}
