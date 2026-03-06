export class BaseActorData extends foundry.abstract.TypeDataModel {

  // Common to all Torg Actor classes
  prepareBaseData() {
    super.prepareBaseData();

    this.statusModifiers = {
      stymied: 0,
      vulnerable: 0,
      darkness: 0,
      waiting: 0,
      concentrating: 0,
    };

    this.targetModifiers = {
      darkness: 0,
    };

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

    // Make visible directly from Actor.
    /*const actor = this.parent;
    actor.statusModifiers = this.statusModifiers;
    actor.targetModifiers = this.targetModifiers;
    actor.defenses = this.defenses;*/
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    // Here Effects are applied, whatever follow cannot be directly affected by Effects
    const actor = this.parent;
    const statuses = actor.statuses;

    // apply status effects (note that base values of 0 might have been modified by Active Effects)
    this.statusModifiers.stymied += statuses.has('veryStymied') ? -4 : statuses.has('stymied') ? -2 : 0;
    this.statusModifiers.vulnerable += statuses.has('veryVulnerable') ? 4 : statuses.has('vulnerable') ? 2 : 0;
    this.statusModifiers.darkness += statuses.has('pitchBlack') ? -6 : statuses.has('dark') ? -4 : statuses.has('dim') ? -2 : 0;
    this.statusModifiers.waiting += statuses.has('waiting') ? -2 : 0;
    this.statusModifiers.concentrating += actor.appliedEffects.filter(ef => ef.statuses.has('concentrating')).length * -2;

    // Place limits on the modifiers (can't cross the 0 boundary)
    if (this.statusModifiers.stymied > 0) this.statusModifiers.stymied = 0;
    if (this.statusModifiers.darkness > 0) this.statusModifiers.darkness = 0;
    if (this.statusModifiers.waiting > 0) this.statusModifiers.waiting = 0;
    if (this.statusModifiers.concentrating > 0) this.statusModifiers.concentrating = 0;
    if (this.statusModifiers.vulnerable < 0) this.statusModifiers.vulnerable = 0;
  }

}