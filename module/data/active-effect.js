import { newTraitsField } from './item/baseItemData.js';

const fields = foundry.data.fields;

/**
 * Addtional fields for TorgEternity ActiveEffect
 * 
 * @param {Boolean} combatToggle Add AE to the Attack/Power section on first tab of Actor sheet.
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
        transferOnOutcome: new fields.StringField({
          choices: CONFIG.torgeternity.testOutcomeLabel,
          required: true,
          initial: '',
          blank: true
        }),
        transferTo: new fields.StringField({
          choices: {
            'actor': 'torgeternity.activeEffect.transferTo.actor',
            'target': 'torgeternity.activeEffect.transferTo.target'
          },
          required: true,
          initial: 'target',
          blank: false
        }),
        applyIfAttackTrait: newTraitsField(),
        applyIfDefendTrait: newTraitsField(),
        defendAgainstTrait: newTraitsField(),
        combatToggle: new fields.BooleanField({ initial: false, }),
      })
    return schema;
  }

  static migrateData(source) {
    if (typeof source.transferOnOutcome === 'number') {
      // map TestResult to string
      const conversion = ['', 'mishap', 'failure', 'standard', 'good', 'outstanding'];
      source.transferOnOutcome = conversion[source.transferOnOutcome] ?? '';
    } else if (source.transferOnAttack)
      source.transferOnOutcome = 'anySuccess';
    if (source.transferOnOutcome && !source.transferTo) source.transferTo = 'target';
    if (source.transferOnAttack) delete source.transferOnAttack;

    if (source.applyIfAttackTrait) source.applyIfAttackTrait = source.applyIfAttackTrait.map(t => (t === 'supernnaturalEvil') ? 'supernaturalEvil' : t)
    if (source.applyIfDefendTrait) source.applyIfDefendTrait = source.applyIfDefendTrait.map(t => (t === 'supernnaturalEvil') ? 'supernaturalEvil' : t)

    return super.migrateData(source);
  }

  /**
   * Suppress the ActiveEffect if it is transferrable to the target.
   * @type {boolean}
   */
  get isSuppressed() {
    // Don't apply the AE to the owning actor if it is being transferred on an attack
    return !!this.transferOnOutcome || !!this.defendAgainstTrait;
  }
}