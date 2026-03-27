const fields = foundry.data.fields;

export class ApplyEffectRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {

  static LOCALIZATION_PREFIXES = ["Torgeternity.BEHAVIOR.TYPES.torgApplyEffect", "BEHAVIOR.TYPES.base"];

  static events = {
    [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#tokenEnter,
    [CONST.REGION_EVENTS.TOKEN_EXIT]: this.#tokenExit,
  };

  static defineSchema() {
    return {
      effectuuid: new fields.DocumentUUIDField({ nullable: true })
    };
  }

  /**
   * 
   * @param {RegionEvent} event 
   * @returns 
   */
  static async #tokenEnter(event) {
    const actor = event?.data?.token?.actor;
    if (!actor || !this.effectuuid) return;
    if (!event.user.isSelf) return;
    const effect = await fromUuid(this.effectuuid, { strict: false });
    if (!effect) return;
    const effectData = {
      ...effect.toObject(),
      disabled: false,
      transfer: false,
      origin: this.behavior.uuid
    }

    return foundry.documents.ActiveEffect.implementation.create(effectData, { parent: actor });
  }

  static async #tokenExit(event) {
    const actor = event?.data?.token?.actor;
    if (!actor) return;
    const behuuid = this.behavior.uuid;
    const effect = actor.effects.find(effect => effect.origin === behuuid);
    if (effect) return effect.delete();
  }
}