import { getTorgValue } from '../../torgchecks.js';
import { BaseItemData } from './baseItemData.js'
import { calcPriceValue } from '../shared.js';

const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class GeneralItemData extends BaseItemData {
  /**
   *
   * @returns {object} Schema fragment for an item
   */
  static defineSchema(itemType) {
    return {
      ...super.defineSchema(itemType),
      quantity: new fields.NumberField({ initial: 1, integer: true, nullable: false }),
      price: new fields.SchemaField({
        dollars: new fields.StringField({ initial: '', nullable: false }),
        // will receive price.torgValue during prepareDerivedData
      }),
      secondaryAxiom: new fields.StringField({ initial: 'none' }),
    };
  }

  static migrateData(source) {
    if (Object.hasOwn(source, 'techlevel')) {
      if (!source.axioms) source.axioms = {};
      source.axioms.tech = source.techlevel;
      delete source.techlevel;
    }

    if (source.secondaryAxiom?.selected) {
      if (source.secondaryAxiom.selected !== 'none') {
        if (!source.axioms) source.axioms = {};
        source.axioms[source.secondaryAxiom.selected] = source.secondaryAxiom.value;
      }
      source.secondaryAxiom = source.secondaryAxiom.selected;
    }

    if (source?.price && typeof source.price === 'string') {
      source.price = { dollars: source.price }
    }
    return super.migrateData(source);
  }

  /**
   * @inheritdoc
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.price.torgValue = calcPriceValue(this.price.dollars);
  }
}