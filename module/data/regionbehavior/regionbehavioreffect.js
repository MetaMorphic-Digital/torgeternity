//
// Most of this class is from Foundry V14.
//
// Extra code was added to support an optional TOKEN DISPOSITION field to only apply to a certain type of Token.
//

const fields = foundry.data.fields;

export class TorgApplyEffectRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {

  static LOCALIZATION_PREFIXES = ["BEHAVIOR.TYPES.torgActiveEffect", "BEHAVIOR.TYPES.base"];

  static events = {
    [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#onTokenEnter,
    [CONST.REGION_EVENTS.TOKEN_EXIT]: this.#onTokenExit,
  };

  static NO_DISPOSITION = 100;

  static defineSchema() {
    return {
      effects: new fields.SetField(new fields.DocumentUUIDField({ type: "ActiveEffect", nullable: false })),
      disposition: new fields.NumberField({
        initial: TorgApplyEffectRegionBehaviorType.NO_DISPOSITION,
        choices: {
          [TorgApplyEffectRegionBehaviorType.NO_DISPOSITION]: "",
          ...foundry.applications.sheets.TokenConfig.TOKEN_DISPOSITIONS
        },
        validationError: "must be a value in CONST.TOKEN_DISPOSITIONS"
      }),
    }
  }

  /**
   * 
   * @param {RegionEvent} event 
   * @returns 
   */
  static async #onTokenEnter(event) {
    if (!event.user.isSelf) return;
    const { token, movement } = event.data;
    if (this.disposition != TorgApplyEffectRegionBehaviorType.NO_DISPOSITION &&
      token.disposition !== this.disposition) return;
    const actor = token?.actor;
    if (!actor) return;

    // Don't apply the effect if this is the token generating the aura
    if (token.attachments.regions.has(this.region)) return;

    const effects = await Promise.all(this.effects.map(fromUuid));
    const toCreate = effects.map(effect => {
      const data = effect.copyForTransfer(null, true);
      delete data._id;
      data.disabled = false;
      data.transfer = false;
      data.origin = this.behavior.uuid;
      return data;
    })

    if (toCreate.length) {
      const resumeMovement = movement ? token.pauseMovement() : undefined;
      await actor.createEmbeddedDocuments("ActiveEffect", toCreate);
      await resumeMovement?.();
    }
  }

  static async #onTokenExit(event) {
    if (!event.user.isSelf) return;
    const { token, movement } = event.data;
    const actor = token?.actor;
    if (!actor) return;
    const toDelete = actor.effects.filter(effect => effect.origin === this.behavior.uuid).map(effect => effect.id);

    if (toDelete.length) {
      const resumeMovement = movement ? token.pauseMovement() : undefined;
      await actor.deleteEmbeddedDocuments("ActiveEffect", toDelete);
      await resumeMovement?.();
    }
  }
}