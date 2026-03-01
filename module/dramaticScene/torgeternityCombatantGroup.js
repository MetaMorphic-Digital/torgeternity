export default class TorgCombatantGroup extends CombatantGroup {
  get disposition() {
    return this.members.size ? this.members.first().token.disposition : undefined;
  }

  async addCombatant(combatant) {
    return combatant.update({ group: this });
  }

  async addCombatants(combatants) {
    return Promise.all(combatants.map(combatant => combatant.update({ group: this })));
  }

  async removeCombatant(combatant) {
    if (this.members.has(combatant))
      return combatant.update({ group: null });
  }

  _onCreate(changed, options, userId) {
    // Ensure Combat Tracker is updated on change of Combatant Groups
    if (this.parent.isView) ui.combat.render();
  }
  _onUpdate(changed, options, userId) {
    // Ensure Combat Tracker is updated on change of Combatant Groups
    if (this.parent.isView) ui.combat.render();
  }
  _onDelete(options, userId) {
    // Remove all combatants from the group (not done automatically by core Foundry)
    for (const combatant of this.members)
      combatant.update({ group: null });
    // Ensure Combat Tracker is updated on change of Combatant Groups
    if (this.parent.isView) ui.combat.render();
  }
}