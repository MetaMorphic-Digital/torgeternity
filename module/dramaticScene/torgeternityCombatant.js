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
    return this.system.turnTaken || (this.combat?.settings.skipDefeated && this.isDefeated);
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
        'system.multiAction.diceBonus': null,
      }, { combatTurn: this.combat.turn + 1 });

      // If the actor of a linked token is deleted, this.actor will be undefiend.
      await this.actor?.toggleStatusEffect('waiting', { active: false });
      await this.actor?.decayEffects();
    } else {
      // Step backwards
      await this.update({ 'system.turnTaken': value }, { combatTurn: this.combat.turn - 1 });
    }
    this.token?.object?.renderFlags.set({ refreshTurnMarker: true })
  }

  async setMultiAction(bonus, multiModifier) {
    return this.update({
      'system.multiAction.diceBonus': bonus,
      'system.multiAction.multiModifier': multiModifier,
    });
  }

  _prepareGroup() {
    super._prepareGroup();
    if (!this.group) return;
    this.group.isWaiting &&= this.isWaiting;
    this.group.turnTaken &&= this.turnTaken;
  }
}
