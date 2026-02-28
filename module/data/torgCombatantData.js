const fields = foundry.data.fields;

export class TorgCombatantData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      turnTaken: new fields.BooleanField({ initial: false }),
      multiAction: new fields.NumberField({ initial: null, nullable: true, integer: true }),
      wasWaiting: new fields.BooleanField({ initial: null, nullable: true })
    }
  }
}
