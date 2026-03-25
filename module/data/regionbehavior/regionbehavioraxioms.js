import { makeAxiomsField } from '../shared.js';

export class ReplaceAxiomsRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {

  static LOCALIZATION_PREFIXES = ["Torgeternity.BEHAVIOR.TYPES.replaceAxioms", "BEHAVIOR.TYPES.base"];

  static events = {
    [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#tokenEnter,
    [CONST.REGION_EVENTS.TOKEN_EXIT]: this.#tokenExit,
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
  static async #tokenEnter(event) {
    event.data.token.actor.prepareData();
  }

  static async #tokenExit(event) {
    event.data.token.actor.prepareData();
  }

  _onUpdate(_changed, _options, _userId) {
    this.region.tokens.forEach(token => token.actor.prepareData());
  }
}