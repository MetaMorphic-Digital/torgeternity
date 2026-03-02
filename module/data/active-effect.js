import {
  newTraitsField
} from './item/baseItemData.js';

const fields = foundry.data.fields;

const toFieldSchema = (choiceList) => new fields.ArrayField(
  new fields.SchemaField({
    _id: new fields.StringField({
      initial: foundry.utils.randomID(),
      blank: true,
      nullable: true,
    }),
    key: new fields.StringField({
      choices: choiceList,
      initial: "",
      blank: true,
      nullable: false
    }),
    value: new fields.StringField({
      initial: "0",
      blank: true
    }),
    mode: new fields.NumberField({
      initial: CONST.ACTIVE_EFFECT_MODES.ADD,
      integer: true
    }),
    priority: new fields.NumberField({
      initial: null,
      nullable: true
    })
  })
);


const setSkillsSchema = () => new fields.SetField(
  new fields.StringField({
    blank: false,
    choices: CONFIG.torgeternity.allSkillsGrouped,
    textSearch: true,
    trim: true,
  }), {
    nullable: false,
    required: true,
    label: "Skills favoured",
    initial: undefined
  }
);

const attributeSetSchema = () => new fields.SetField(
  new fields.StringField({
    blank: false,
    choices: CONFIG.torgeternity.attributesFavorAndLabel,
    textSearch: true,
    trim: true
  }), {
    nullable: false,
    required: true,
    label: "Attributes favoured",
    initial: undefined
  }
)

const defensesModSchema = () => new fields.ArrayField(
  new fields.SchemaField({
    _id: new fields.StringField({
      initial: foundry.utils.randomID(),
      blank: true,
      nullable: true,
    }),
    key: new fields.StringField({
      choices: CONFIG.torgeternity.defensesModAndLabel,
      initial: "",
      blank: true,
      nullable: false
    }),
    value: new fields.StringField({
      initial: "0",
      blank: true
    }),
    mode: new fields.NumberField({
      initial: CONST.ACTIVE_EFFECT_MODES.ADD,
      integer: true
    }),
    priority: new fields.NumberField({
      initial: null,
      nullable: true
    })
  })
);



/**
 * Addtional fields for TorgEternity ActiveEffect
 * 
 * @param {Boolean} transferOnAttack Apply this effect to the target of the attack if the attack is successful.
 * @param {Boolean} transferOnOutcome Apply this effect to the target of the attack if the attack test has this specific outcome.
 * @param {SetField(StringField)} applyIfTrait Apply this effect to the item if the owning actor has one of these traits.
 * @param {SetField(StringField)} applyVsTrait Apply this effect to the item if the target has one of these traits.
 * @param {SetField(StringField)} skillsFavor Wether a skill is favor by this active effect
 */
export class TorgActiveEffectData extends (foundry.data.ActiveEffectTypeDataModel ?? foundry.abstract.TypeDataModel) {
  // Foundry 14 - change base class to foundry.data.ActiveEffectTypeDataModel

  static LOCALIZATION_PREFIXES = ["torgeternity.activeEffect"];
  static defineSchema() {
    const skillAddChoices = Object.fromEntries(Object.entries(CONFIG.torgeternity.skills).map(([k, v]) => [(v +
      '.adds').replace('torgeternity', 'system'), v]))

    const attributesAddsChoices = Object.fromEntries(Object.entries(CONFIG.torgeternity.attributeTypes).map(([k,
      v
    ]) => [(v + '.value').replace('torgeternity', 'system'), v]))

    const schema = (game.release.generation >= 14) ? foundry.data.ActiveEffectTypeDataModel.defineSchema() : {};
    Object.assign(schema, {
      // ...foundry.data.ActiveEffectTypeDataModel.defineSchema(),    // Foundry 14+
      transferOnAttack: new fields.BooleanField({
        initial: false,
      }),
      transferOnOutcome: new fields.NumberField({
        choices: CONFIG.torgeternity.testOutcomeLabel,
        initial: null,
        integer: true,
        nullable: true,
      }),
      applyIfAttackTrait: newTraitsField(),
      applyIfDefendTrait: newTraitsField(),
      combatToggle: new fields.BooleanField({
        initial: false,
      }),
      skillsAdds: toFieldSchema(skillAddChoices),
      attributesAdds: toFieldSchema(attributesAddsChoices),
      skillsFavor: setSkillsSchema(),
      attributesFavor: attributeSetSchema(),
      defensesChanges: defensesModSchema(),
      otherChanges: toFieldSchema(["system.possibilityPerAct"]),
    })
    return schema;
  }

  static migrateData(source) {
    if (source.applyIfAttackTrait) source.applyIfAttackTrait = source.applyIfAttackTrait.map(t => (t === 'supernnaturalEvil') ? 'supernaturalEvil' : t)
    if (source.applyIfDefendTrait) source.applyIfDefendTrait = source.applyIfDefendTrait.map(t => (t === 'supernnaturalEvil') ? 'supernaturalEvil' : t)
    const migrated = super.migrateData(source);
    return migrated
  }

  /**
   * Suppress the ActiveEffect if it is transferrable to the target.
   * @type {boolean}
   */
  get isSuppressed() {
    // Don't apply the AE to the owning actor if it is being transferred on an attack
    return this.system && (this.system.transferOnAttack || this.system.transferOnOutcome);
  }
}
