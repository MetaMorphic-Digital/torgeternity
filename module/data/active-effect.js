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
export class TorgActiveEffectData extends foundry.data.ActiveEffectTypeDataModel {
  // Foundry 14 - change base class to foundry.data.ActiveEffectTypeDataModel

  static LOCALIZATION_PREFIXES = ["torgeternity.activeEffect"];

  static defineSchema() {
    const schema = super.defineSchema();
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
        activeIfTrait: newTraitsField('effectTestTraits'),
        applyIfAttackTrait: newTraitsField('effectTestTraits'),
        applyIfDefendTrait: newTraitsField('effectTestTraits'),
        defendAgainstTrait: newTraitsField('effectTestTraits'),
        applyIfAttackTraitCombine: newCombineTraitsField(),
        applyIfDefendTraitCombine: newCombineTraitsField(),
        defendAgainstTraitCombine: newCombineTraitsField(),
        itemsToBestow: new fields.SetField(new fields.JSONField),
        combatToggle: new fields.BooleanField({ initial: false, }),
        concentratingId: new fields.DocumentUUIDField({ nullable: true }),
        emanation: new fields.SchemaField({
          radius: new fields.NumberField({ integer: true, nullable: true, initial: null }),
          color: new fields.ColorField({ initial: "#000040" }),
          //opacity: new fields.AlphaField({ initial: 0 }),  // no support for this (yet?)
          disposition: new fields.NumberField({ // as per BaseToken
            required: true,
            choices: foundry.applications.sheets.TokenConfig.TOKEN_DISPOSITIONS,
            initial: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            validationError: "must be a value in CONST.TOKEN_DISPOSITIONS"
          }),
          visibility: new fields.NumberField({
            required: true,
            initial: CONST.REGION_VISIBILITY.LAYER_UNLOCKED ?? CONST.REGION_VISIBILITY.ALWAYS, // fallback for V13
            choices: Object.values(CONST.REGION_VISIBILITY),
            label: 'REGION.FIELDS.visibility.label',
            hint: 'REGION.FIELDS.visibility.hint',
          }),
        })
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

    if (source.changes) {
      for (const change of source.changes) {
        if (!Object.hasOwn(change, 'type') && Object.hasOwn(change, 'mode')) {
          // CONST.ACTIVE_EFFECT_MODES to Object.keys(CONST.ACTIVE_EFFECT_CHANGE_TYPES)
          const MODE_MAP = {
            [0 /*CONST.ACTIVE_EFFECT_MODES.CUSTOM*/]: "custom",
            [1 /*CONST.ACTIVE_EFFECT_MODES.MULTIPLY*/]: "multiply",
            [2 /*CONST.ACTIVE_EFFECT_MODES.ADD*/]: "add",
            [3 /*CONST.ACTIVE_EFFECT_MODES.DOWNGRADE*/]: "downgrade",
            [4 /*CONST.ACTIVE_EFFECT_MODES.OVERRIDE*/]: "override",
            [5 /*CONST.ACTIVE_EFFECT_MODES.UPGRADE*/]: "upgrade",
          }
          change.type = MODE_MAP[change.mode];
          if (change.type === 'add' && Number.isNumeric(change.value) && change.value < 0) {
            change.type = 'subtract';
            change.value = -change.value;
          }
          delete change.mode;
        }
      }
    }
    return super.migrateData(source);
  }

  /**
   * Suppress the ActiveEffect if it is transferrable to the target.
   * @type {boolean}
   */
  get isSuppressed() {
    // Aura Effects module uses its own type for the aura
    if (this.parent.type !== 'base') return false;
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