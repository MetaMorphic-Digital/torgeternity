import { makeAxiomsField } from '../shared.js';

export class ReplaceAxiomsRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {

  static LOCALIZATION_PREFIXES = ["Torgeternity.BEHAVIOR.TYPES.replaceAxioms", "BEHAVIOR.TYPES.base"];

  static events = {
    [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#tokenEnter,
    [CONST.REGION_EVENTS.TOKEN_EXIT]: this.#tokenExit,
  };

  static defineSchema() {
    return {
      axioms: makeAxiomsField()
    };
  }

  /**
   * 
   * @param {RegionEvent} event 
   * @returns 
   */
  static async #tokenEnter(event) {
    if (!event.user.isSelf) return;
    console.log('tokenEnter', event);
    event.data.token.actor.update({ "system.zone.axiomOverride": this.axioms });
  }

  static async #tokenExit(event) {
    if (!event.user.isSelf) return;
    const noaxioms = { magic: null, social: null, spirit: null, tech: null };
    console.log('tokenExit', event);
    event.data.token.actor.update({ "system.zone.axiomOverride": noaxioms });
  }

  _onUpdate(changed, options, userId) {
    console.log('_onUpdate', changed, options, userId);
    for (const token of this.region.tokens) {
      const actor = token.actor;
      if (actor.isOwner)
        actor.update({ "system.zone.axiomOverride": this.axioms });
    }
  }
}