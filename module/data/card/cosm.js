const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class CosmCardData extends foundry.abstract.TypeDataModel {
  /**
   *
   * @returns {object} Schema fragment for a Storm Knight or Threat
   */
  static defineSchema() {
    return {
      cosm: new fields.StringField({ initial: 'none', choices: CONFIG.torgeternity.cosmTypes, textSearch: true, required: true, blank: false, nullable: false }),
    };
  }
}
