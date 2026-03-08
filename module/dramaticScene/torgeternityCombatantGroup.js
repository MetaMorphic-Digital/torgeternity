export default class TorgCombatantGroup extends foundry.documents.CombatantGroup {
  // Properties from CombatantGroup
  //   defeated
  //   hidden
  //   members

  isWaiting = this.isWaiting;
  turnTaken = this.turnTaken;
  //isOpen = this.isOpen;

  prepareBaseData() {
    super.prepareBaseData();
    this.isWaiting = true;
    this.turnTaken = true;
    //this.isOpen = true;
  }

  get isOpen() {
    if (!this.parent.openGroups) this.parent.openGroups = {};
    if (!Object.hasOwn(this.parent.openGroups, this.id)) this.parent.openGroups[this.id] = true;
    return this.parent.openGroups[this.id];
  }

  set isOpen(value) {
    if (!this.parent.openGroups) this.parent.openGroups = {};
    this.parent.openGroups[this.id] = value;
  }

  get disposition() {
    return this.members.size ? this.members.first().token.disposition : undefined;
  }

  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    // Ensure Combat Tracker is updated on change of Combatant Groups
    if (!this.parent.openGroups) this.parent.openGroups = {};
    this.parent.openGroups[this.id] = true;
    if (this.parent.isView) ui.combat.render();
  }

  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    // Ensure Combat Tracker is updated on change of Combatant Groups
    if (this.parent.isView) ui.combat.render();
  }

  _onDelete(options, userId) {
    // Remove all combatants from the group (not done automatically by core Foundry)
    for (const combatant of this.members)
      combatant.update({ group: null });
    // Ensure Combat Tracker is updated on change of Combatant Groups
    if (this.parent.isView) ui.combat.render();
    delete this.parent.openGroups[this.id];
    super._onDelete(options, userId);
  }
}