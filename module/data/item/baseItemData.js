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
      axioms: makeAxiomsField()
    };
  }
  /**
   * @inheritdoc
   * @param {object} source delivered data from the constructor
   */
  static migrateData(source) {
    if (source.cosm !== undefined) source.cosm = migrateCosm(source.cosm);
    if (source.traits?.length) {
      // Map renamed traits
      source.traits = source.traits.map(t => (t === 'supernnaturalEvil') ? 'supernaturalEvil' : t);
      // Remove invalid traits
      const badTraits = source.traits.filter(t => !Object.hasOwn(CONFIG.torgeternity.allItemTraits, t));
      source.traits = source.traits.filter(t => Object.hasOwn(CONFIG.torgeternity.allItemTraits, t));
      if (badTraits.length) console.info(`Unsupported traits discarded: ${badTraits}`)
    }
    return super.migrateData(source);
  }
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