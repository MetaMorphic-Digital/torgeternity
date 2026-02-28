/**
 *
 */
export default class TorgCombatant extends Combatant {

  static migrateData(source) {
    foundry.abstract.Document._addDataFieldMigration(source, 'flags.world.turnTaken', 'system.turnTaken');
    foundry.abstract.Document._addDataFieldMigration(source, 'flags.torgeternity.multiAction', 'system.multiAction');
    return super.migrateData(source);
  }

  get turnTaken() {
    return this.system.turnTaken;
  }

  get isWaiting() {
    return this.actor?.hasStatusEffect('waiting');
  }

  async setTurnTaken(value) {
    if (value === this.turnTaken) return;

    await this.update({ 'system.turnTaken': value });
    if (value) {
      // Turn has been taken
      await this.actor.toggleStatusEffect('waiting', { active: false });
      await this.clearCurrentBonus();
      await this.actor.decayEffects();
    }
    this.token?.object?.renderFlags.set({ refreshTurnMarker: true })
  }

  get currentBonus() {
    return this.system.multiAction;
  }

  async setCurrentBonus(value) {
    return this.update({ 'system.multiAction': value });
  }

  async clearCurrentBonus() {
    return this.update({ 'system.multiAction': null });
  }
}
