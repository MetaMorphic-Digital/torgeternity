import TorgeternityActor from '../documents/actor/torgeternityActor.js';
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
        applyOnOutcome: new fields.StringField({
          choices: CONFIG.torgeternity.testOutcomeLabel,
          required: true,
          initial: '',
          blank: true
        }),
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
        activeIfTrait: newTraitsField('effectActiveTraits'),
        applyIfAttackTrait: newTraitsField('effectTestTraits'),
        applyIfDefendTrait: newTraitsField('effectTestTraits'),
        defendAgainstTrait: newTraitsField('effectTestTraits'),
        applyIfAttackTraitCombine: newCombineTraitsField(),
        applyIfDefendTraitCombine: newCombineTraitsField(),
        defendAgainstTraitCombine: newCombineTraitsField(),

        combatToggle: new fields.BooleanField({ initial: false, }),
        concentratingId: new fields.DocumentUUIDField({ nullable: true })
      })
    return schema;
  }

  static migrateData(source) {

    if (source.transferOnOutcome === "0" || source.transferOnOutcome === 0)
      source.transferOnOutcome = "";
    if (typeof source.transferOnOutcome === 'number' && source.transferOnOutcome !== 0) {
      // map TestResult to string
      const conversion = ['', 'mishap', 'failure', 'standard', 'good', 'outstanding'];
      source.transferOnOutcome = conversion[source.transferOnOutcome] ?? '';
    } else if (source.transferOnAttack)
      source.transferOnOutcome = 'anySuccess';
    if (source.transferOnOutcome && !source.transferTo) source.transferTo = 'target';
    delete source.transferOnAttack;

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
    if (this.applyOnOutcome.length || this.transferOnOutcome.length || this.defendAgainstTrait.size) return true;

    // If the trait is conditionally active, then check for traits/conditions on the owning actor (if any)
    if (!this.activeIfTrait.size) return false;
    const actor = this.parent.parent?.actor ?? this.parent.parent;
    if (!actor || !(actor instanceof TorgeternityActor)) return false;
    // Quickest test is to check conditions first
    if (this.activeIfTrait.find(status => actor.statuses.has(status))) return false;

    // Look for an (equipped) item with a matching trait
    return !actor.items.find(item => item.system.traits.size &&
      (!item.system.canEquip || item.isEquipped) &&
      item.system.traits.find(trait => this.activeIfTrait.has(trait)));
  }
}

function newCombineTraitsField() {
  return new fields.StringField({
    blank: false,
    nullable: false,
    required: true,
    choices: {
      'and': "torgeternity.activeEffect.match.and",
      'not': "torgeternity.activeEffect.match.not",
      'or': "torgeternity.activeEffect.match.or",
    },
    trim: true,
    initial: 'or',
  })
}