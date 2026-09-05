const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class DestinyCardData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["CARD", "CARD.DESTINY"];
  /**
   *
   * @returns {object} Schema fragment for a Storm Knight or Threat
   */
  static defineSchema() {
    return {
      pooled: new fields.BooleanField({ initial: false, label: 'torgeternity.dramaCard.pooled' }),
      special: new fields.StringField({ choices: CONFIG.torgeternity.destinyActions, label: 'torgeternity.destinyCard.special' }),
      macro: new fields.DocumentUUIDField({ type: "Macro" }), // triggered when the card is played
    };
  }
}
