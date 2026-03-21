import { migrateCosm, makeAxiomsField } from '../shared.js';

const fields = foundry.data.fields;

export class BaseItemData extends foundry.abstract.TypeDataModel {

  static LOCALIZATION_PREFIXES = ["torgeternity"];

  /**
 *
 * @returns {object} Schema fragment for an item
 */
  static defineSchema(itemType) {
    return {
      cosm: new fields.StringField({ initial: 'none', choices: CONFIG.torgeternity.cosmTypes, textSearch: true, required: true, blank: false, nullable: false }),
      description: new fields.HTMLField({ initial: '', textSearch: true }),
      traits: newTraitsField(itemType),
      axioms: makeAxiomsField(),
      //itemsToBestow: new fields.SetField(new fields.DocumentUUIDField({ nullable: null })),  // id of other items added/removed with this Item
      itemsToBestow: new fields.SetField(new fields.TypeDataField(foundry.documents.Item)),  // id of other items added/removed with this Item
      bestowedBy: new fields.DocumentIdField(),  // the id of the other item that automatically added this Item
    };
  }
  /**
   * @inheritdoc
   * @param {object} source delivered data from the constructor
   */
  static migrateData(source) {
    if (source.grantsItems) {
      if (source.itemsToBestow === undefined) source.itemsToBestow = source.grantsItems;
      delete source.grantsItems;
    }
    if (source.grantedBy) {
      if (source.bestowedBy === undefined) source.bestowedBy = source.grantedBy;
      delete source.grantedBy;
    }
    if (source.cosm !== undefined) source.cosm = migrateCosm(source.cosm);
    if (source.traits?.length) {
      // Map renamed traits
      source.traits = source.traits.map(t => (t === 'supernnaturalEvil') ? 'supernaturalEvil' : t);
      // Remove invalid traits
      const validTraits = this.schema.fields.traits.element.choices;
      const badTraits = source.traits.filter(t => !Object.hasOwn(validTraits, t));
      source.traits = source.traits.filter(t => Object.hasOwn(validTraits, t));
      if (badTraits.length)
        console.warn(`Unsupported trait on ${this.name} discarded: ${badTraits}`)
    }
    if (Object.hasOwn(source, 'transferenceID')) {
      if (!Object.hasOwn(source, 'bestowedBy'))
        source.bestowedBy = source.transferenceID;
      delete source.transferenceID;
    }
    if (Object.hasOwn(source, 'perksData') || Object.hasOwn(source, 'customAttackData')) {
      if (!source.itemsToBestow)
        source.itemsToBestow = (source.perksData ?? []).concat(source.customAttackData ?? []);
      if (Object.hasOwn(source, 'perksData')) delete source.perksData;
      if (Object.hasOwn(source, 'customAttackData')) delete source.customAttackData;
    }

    return super.migrateData(source);
  }

  // Can this Item type be equipped?
  get canEquip() { return false; }
}

export function newTraitsField(itemType) {
  return new fields.SetField(
    new fields.StringField({
      // StringField options
      blank: false,
      choices: (itemType && CONFIG.torgeternity.specificItemTraits[itemType]) ?? CONFIG.torgeternity.allItemTraits,
      textSearch: true,
      trim: true,
    }),
    { // SetField options (ArrayFieldOptions)
      nullable: false,
      required: true
    });
}