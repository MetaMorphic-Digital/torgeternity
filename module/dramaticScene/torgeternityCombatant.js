/**
 *
 */
export default class TorgCombatant extends Combatant {

  // this.#turnTaken stored in flags, to avoid having to create a DataModel to store one extra boolean

  /**
   *
   * @param data
   * @param options
   * @param user
   */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;
    this.updateSource({ "flags.world.turnTaken": false });
  }

  get turnTaken() {
    return this.getFlag('world', 'turnTaken');
  }

  get isWaiting() {
    return this.actor?.hasStatusEffect('waiting');
  }

  async setTurnTaken(value) {
    if (value === this.turnTaken) return;

    await this.setFlag('world', 'turnTaken', value);
    if (value) {
      await this.actor.toggleStatusEffect('waiting', { active: false });
      await this.clearCurrentBonus();
      await this.actor.decayEffects();
    }
    this.token?.object?.renderFlags.set({ refreshTurnMarker: true })
  }

  get currentBonus() {
    return this.getFlag('torgeternity', 'multiAction');
  }

  async setCurrentBonus(value) {
    return this.setFlag('torgeternity', 'multiAction', value);
  }

  async clearCurrentBonus() {
    return this.unsetFlag('torgeternity', 'multiAction');
  }
}
