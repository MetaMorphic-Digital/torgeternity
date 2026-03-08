export class BaseActorData extends foundry.abstract.TypeDataModel {

  // Common to all Torg Actor classes
  prepareBaseData() {
    super.prepareBaseData();

    /**
     * Actual modifiers from the various game statuses
     * @public
     */
    this.statusModifiers = {
      stymied: 0,
      vulnerable: 0,
      darkness: 0,
      waiting: 0,
      concentrating: 0,
    };

    /** 
     * How this Actor modifies the statusModifiers of the target.
     * @public
     */
    this.targetModifiers = {
      darkness: 0,    // e.g. For Darkvision, this should be 4
    };

    /**
     * The various defensive values on this Actor.
     * @public
     */
    this.defenses = {
      damageTraits: {
        // Armor: addition armor of the defender when damage is of the indicated type
        energyArmor: 0,
        fireArmor: 0,
        forceArmor: 0,
        iceArmor: 0,
        lightningArmor: 0,
        // Defense: increases the Defense skill of the defender when damage is of the indicated type
        energyDefense: 0,
        fireDefense: 0,
        forceDefense: 0,
        iceDefense: 0,
        lightningDefense: 0
      }
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