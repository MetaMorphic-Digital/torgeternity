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
      quantity: new fields.NumberField({ initial: 1, integer: true }),
      price: new fields.SchemaField({
        dollars: new fields.StringField({ initial: '', nullable: false }),
        // will receive price.torgValue during prepareDerivedData
      }),
      secondaryAxiom: new fields.StringField({ initial: 'none' }),
      equipped: new fields.SchemaField({
        carryType: new fields.StringField({ required: true, nullable: false, choices: CONFIG.torgeternity.carryTypes, initial: "stowed" }),
        handsHeld: new fields.NumberField({ initial: 0, integer: true }),
      })
    };
  }

  static migrateData(source) {
    if (Object.hasOwn(source, 'techlevel')) {
      if (!source.axioms) source.axioms = {};
      source.axioms.tech = source.techlevel;
      delete source.techlevel;
    }
    if (typeof source.equipped === 'boolean') {
      // Armor will deal with 'worn'
      source.equipped = { carryType: source.equipped ? 'held' : 'stowed' };
      if (source.equipped.carryType === 'held') {
        source.equipped.handsHeld = source.traits?.includes('twoHanded') ? 2 : 1;
      }
    } else if (!Object.hasOwn(source, 'equipped')) {
      this.equipped = { carryType: 'stowed', handsHeld: 0 }
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

  /**
   * @returns {String} the carry-type in which this Item is assumed to be Equipped
   */
  get usage() {
    return 'held';
  }
}