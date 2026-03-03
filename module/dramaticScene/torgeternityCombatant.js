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

    if (value) {
      // Turn has been taken
      await this.update({
        'system.turnTaken': value,
        'system.multiAction': null,
      }, { combatTurn: this.combat.turn + 1 });

      await this.actor.toggleStatusEffect('waiting', { active: false });
      await this.actor.decayEffects();
    } else {
      // Step backwards
      await this.update({ 'system.turnTaken': value }, { combatTurn: this.combat.turn - 1 });
    }
    this.token?.object?.renderFlags.set({ refreshTurnMarker: true })
  }

  get currentBonus() {
    return this.system.multiAction;
  }

  async setCurrentBonus(value) {
    return this.update({ 'system.multiAction': value });
  }

  _prepareGroup() {
    super._prepareGroup();
    if (!this.group) return;
    this.group.isWaiting &&= this.isWaiting;
    this.group.turnTaken &&= this.turnTaken;
  }
}
