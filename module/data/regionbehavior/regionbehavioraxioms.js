import { makeAxiomsField } from '../shared.js';

export class ReplaceAxiomsRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {

  static LOCALIZATION_PREFIXES = ["Torgeternity.BEHAVIOR.TYPES.replaceAxioms", "BEHAVIOR.TYPES.base"];

  static events = {
    [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#onTokenEnter,
    [CONST.REGION_EVENTS.TOKEN_EXIT]: this.#onTokenExit,
  };

  static defineSchema() {
    return {
      axioms: makeAxiomsField(/*nullable*/true)
    };
  }

  /**
   * 
   * @param {RegionEvent} event 
   * @returns 
   */
  static async #onTokenEnter(event) {
    event.data.token.actor.reset();
  }

  static async #onTokenExit(event) {
    event.data.token.actor.reset();
  }

  _onUpdate(_changed, _options, _userId) {
    this.region.tokens.forEach(token => token.actor.reset());
  }
}