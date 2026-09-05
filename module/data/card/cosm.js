const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class CosmCardData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["CARD", "CARD.COSM"];
  /**
   *
   * @returns {object} Schema fragment for a Storm Knight or Threat
   */
  static defineSchema() {
    return {
      cosm: new fields.StringField({ initial: 'none', choices: CONFIG.torgeternity.cosmTypes, textSearch: true, required: true, blank: false, nullable: false }),
      macro: new fields.DocumentUUIDField({ type: "Macro" }), // triggered when the card is played
    };
  }
}
