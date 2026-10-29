const fields = foundry.data.fields;

export class TorgCombatantData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      turnTaken: new fields.BooleanField({ initial: false }),
      multiAction: new fields.SchemaField({
        diceBonus: new fields.NumberField({ initial: null, nullable: true, integer: true }),
        multiModifier: new fields.NumberField({ initial: null, nullable: true, integer: true }),
      })
    }
  }

  migrateData(source) {
    if (Number.isInteger(source.multiAction)) {
      source.multiAction = { diceBonus: source.multiAction };
    }
    return super.migrateData(source);
  }
}
