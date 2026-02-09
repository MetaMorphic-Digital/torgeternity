import { newTraitsField } from './item/baseItemData.js';

const fields = foundry.data.fields;

/**
 * Addtional fields for TorgEternity ActiveEffect
 * 
 * @param {Boolean} transferOnAttack Apply this effect to the target of the attack if the attack is successful.
 * @param {Boolean} transferOnOutcome Apply this effect to the target of the attack if the attack test has this specific outcome.
 * @param {SetField(StringField)} applyIfTrait Apply this effect to the item if the owning actor has one of these traits.
 * @param {SetField(StringField)} applyVsTrait Apply this effect to the item if the target has one of these traits.
 */
export class TorgActiveEffectData extends (foundry.data.ActiveEffectTypeDataModel ?? foundry.abstract.TypeDataModel) {
  // Foundry 14 - change base class to foundry.data.ActiveEffectTypeDataModel

  static LOCALIZATION_PREFIXES = ["torgeternity.activeEffect"];

  static defineSchema() {
    const schema = (game.release.generation >= 14) ? foundry.data.ActiveEffectTypeDataModel.defineSchema() : {};
    Object.assign(schema,
      {
        // ...foundry.data.ActiveEffectTypeDataModel.defineSchema(),    // Foundry 14+
        transferOnAttack: new fields.BooleanField({ initial: false, }),
        transferOnOutcome: new fields.NumberField({
          choices: CONFIG.torgeternity.testOutcomeLabel,
          integer: true,
          nullable: true,
        }),
        applyIfAttackTrait: newTraitsField(),
        applyIfDefendTrait: newTraitsField(),
        combatToggle: new fields.BooleanField({ initial: false, }),
      })
    return schema;
  }

  static migrateData(source) {
    if (source.applyIfAttackTrait) source.applyIfAttackTrait = source.applyIfAttackTrait.map(t => (t === 'supernnaturalEvil') ? 'supernaturalEvil' : t)
    if (source.applyIfDefendTrait) source.applyIfDefendTrait = source.applyIfDefendTrait.map(t => (t === 'supernnaturalEvil') ? 'supernaturalEvil' : t)
    return super.migrateData(source);
  }
}