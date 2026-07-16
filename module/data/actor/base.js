import { notPersistedBoolean, notPersistedNumber } from '../shared.js';

const fields = foundry.data.fields;

export class BaseActorData extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      statusModifiers: new fields.SchemaField({
        /**
         * Actual modifiers from the various game statuses
         * @public
         */
        stymied: notPersistedNumber(),
        vulnerable: notPersistedNumber(),
        darkness: notPersistedNumber(),
        waiting: notPersistedNumber(),
        concentrating: notPersistedNumber(),
      }, { persisted: false }),
      targetModifiers: new fields.SchemaField({
        /** 
         * How this Actor modifies the statusModifiers of the target.
         * @public
         */
        darkness: notPersistedNumber(),  // e.g. For Darkvision, this should be 4
        range: notPersistedNumber(),
      }, { persisted: false }),
      defenses: new fields.SchemaField({
        /**
         * The various defensive values on this Actor.
         * @public
         */
        activeDefense: notPersistedNumber(),
        damageTraits: new fields.SchemaField({
          // Armor: addition armor of the defender when damage is of the indicated type
          energyArmor: notPersistedNumber(),
          fireArmor: notPersistedNumber(),
          forceArmor: notPersistedNumber(),
          iceArmor: notPersistedNumber(),
          lightningArmor: notPersistedNumber(),
          // Defense: increases the Defense skill of the defender when damage is of the indicated type
          energyDefense: notPersistedNumber(),
          fireDefense: notPersistedNumber(),
          forceDefense: notPersistedNumber(),
          iceDefense: notPersistedNumber(),
          lightningDefense: notPersistedNumber(),
        }, { persisted: false }),
      }, { persisted: false }),
      // How many "attunable" items can be attuned at the same time.
      maxAttunable: notPersistedNumber(1),
      // Traits added by Active Effects
      extraTraits: new fields.SetField(
        new fields.StringField({ blank: false, choices: () => CONFIG.torgeternity.allItemTraits }),
        { persisted: false }),
    }
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    // CONFIG.statusEffects has the relevant changes to this.statusModifiers which will have been applied.
    // (In Foundry V14, other AE might want to use the numeric modifier of the effect as the value of another effect.)

    // Place limits on the modifiers (can't cross the 0 boundary)
    // NEGATIVE modifiers
    if (this.statusModifiers.stymied > 0) this.statusModifiers.stymied = 0;
    if (this.statusModifiers.darkness > 0) this.statusModifiers.darkness = 0;
    if (this.statusModifiers.waiting > 0) this.statusModifiers.waiting = 0;
    if (this.statusModifiers.concentrating > 0) this.statusModifiers.concentrating = 0;
    // POSITIVE modifiers
    if (this.statusModifiers.vulnerable < 0) this.statusModifiers.vulnerable = 0;
  }

}