import { BaseItemData } from './baseItemData.js';

const fields = foundry.data.fields;

/**
 * @inheritdoc
 */
export class PerkItemData extends BaseItemData {
  /**
   * @returns {object} Schema fragment for a perk
   */
  static defineSchema() {
    return {
      ...super.defineSchema('perk'),
      category: new fields.StringField({ initial: 'special', choices: CONFIG.torgeternity.perkTypes, textSearch: true }),
      prerequisites: new fields.StringField({ initial: '' }),
      generalContradiction: new fields.BooleanField({ initial: false }),
      enhancements: new fields.ArrayField(new fields.SchemaField({
        description: new fields.StringField({ initial: '' }),
        taken: new fields.BooleanField({ initial: false }),
        title: new fields.StringField({ initial: '' }),
      })),
      limitations: new fields.ArrayField(new fields.StringField({ initial: '' })),
      timestaken: new fields.StringField({ initial: '' }),
      secondaryAxiom: new fields.StringField({ initial: 'none' }),
    };
  }

  static migrateData(source) {
    if (Object.hasOwn(source, 'secondaryAxiom') && source.secondaryAxiom?.selected) {
      if (source.secondaryAxiom.selected !== 'none') {
        if (!source.axioms) source.axioms = {};
        source.axioms[source.secondaryAxiom.selected] = source.secondaryAxiom.value;
      }
      source.secondaryAxiom = source.secondaryAxiom.selected;
    }
    if (Object.hasOwn(source, 'category') && !CONFIG.torgeternity.perkTypes[source.category]) {
      source.category = source.category.toLowerCase();
    }
    if (Object.hasOwn(source, 'pulpPowers')) {
      if (!source.enhancements && Object.hasOwn(source.pulpPowers, 'enhancementNumber')) {
        source.enhancements = [];
        for (let idx = 1; idx <= source.pulpPowers.enhancementNumber; idx++)
          source.enhancements.push(source.pulpPowers[`enhancement${idx.paddedString(2)}`]);
      }

      if (!source.limitations && Object.hasOwn(source.pulpPowers, 'limitationNumber')) {
        source.limitations = [];
        for (let idx = 1; idx <= source.pulpPowers.limitationNumber; idx++)
          source.limitations.push(source.pulpPowers[`limitation${idx.paddedString(2)}`]);
      }

      delete source.pulpPowers;
    }
    return super.migrateData(source);
  }
}
