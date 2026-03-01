const fields = foundry.data.fields;
/**
 * @inheritdoc
 */
export class DramaCardData extends foundry.abstract.TypeDataModel {
  /**
   *
   * @returns {object} Schema fragment for a Storm Knight or Threat
   */
  static conditionField(label) {
    return new fields.StringField({ initial: 'none', choices: CONFIG.torgeternity.dramaConflicts, label: `torgeternity.dramaCard.${label}`, required: true, blank: false, nullable: false })
  }

  static defineSchema() {
    return {
      // approvedActions = maneuver trick taunt intimidate any attack defend multiAction (one or two)
      // dsrLine = ABCD, complication, criticalProblem, possibleSetback
      // *Condition = none fatigued surge stymied confused inspiration flurry up setback
      approvedActions: new fields.StringField({ initial: '', label: 'torgeternity.dramaCard.approvedActions' }),
      cosm: new fields.StringField({ initial: 'none', choices: CONFIG.torgeternity.cosmTypes, textSearch: true, required: true, blank: false, nullable: false }),
      dsrLine: new fields.StringField({ initial: '', label: 'torgeternity.dramaCard.dsrLine' }),
      heroesConditionsDramatic: DramaCardData.conditionField('heroesConflict'),
      heroesConditionsStandard: DramaCardData.conditionField('heroesConflict'),
      heroesFirstDramatic: new fields.BooleanField({ initial: true, label: 'torgeternity.dramaCard.heroesFirst' }),
      heroesFirstStandard: new fields.BooleanField({ initial: true, label: 'torgeternity.dramaCard.heroesFirst' }),
      rule: new fields.StringField({ initial: '', label: 'torgeternity.dramaCard.rule' }),
      villainsConditionsDramatic: DramaCardData.conditionField('villainsConflict'),
      villainsConditionsStandard: DramaCardData.conditionField('villainsConflict'),
    };
  }
}
