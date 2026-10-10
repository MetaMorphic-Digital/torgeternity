//
// A version of foundry.data.regionBehaviors.ApplyActiveEffectRegionBehaviorType  updated to include disposition.
//
// Extra code was added to support an optional TOKEN DISPOSITION field to only apply to a certain type of Token.
//

const fields = foundry.data.fields;

export class TorgApplyEffectRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {

  /** @override */
  static LOCALIZATION_PREFIXES = ["BEHAVIOR.TYPES.torgActiveEffect", "BEHAVIOR.TYPES.applyActiveEffect", "BEHAVIOR.TYPES.base"];

  static NO_DISPOSITION = 100;

  /** @override */
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

  /* ---------------------------------------- */

  /**
   * Apply the Active Effects when the Token enters the Region.
   * @param {RegionTokenEnterEvent} event
   * @this {ApplyActiveEffectRegionBehaviorType}
   */
  static async #onTokenEnter(event) {
    if (!event.user.isSelf) return;
    const { token, movement } = event.data;
    const actor = token.actor;
    if (!actor) return;

    // TORG START
    // Don't apply the effect if this token has the wrong disposition
    if (this.disposition !== TorgApplyEffectRegionBehaviorType.NO_DISPOSITION &&
      token.disposition !== this.disposition) return;
    // Don't apply the effect if this is the token generating the aura
    if (token.attachments.regions.has(this.region)) return;
    // TORG FINISH

    const resumeMovement = movement ? token.pauseMovement() : undefined;
    const effects = await Promise.all(this.effects.map(fromUuid));
    const toCreate = this.#getEffectsToCreate(actor, effects);
    if (toCreate.length) await actor.createEmbeddedDocuments("ActiveEffect", toCreate);
    await resumeMovement?.();
  }

  /* ---------------------------------------- */

  /**
   * Un-apply the Active Effects when the Token exists the Region.
   * @param {RegionTokenExitEvent} event
   * @this {ApplyActiveEffectRegionBehaviorType}
   */
  static async #onTokenExit(event) {
    if (!event.user.isSelf) return;
    const { token, movement } = event.data;
    const actor = token?.actor;
    if (!actor) return;
    const toDelete = this.#getEffectsToDelete(actor);
    if (!toDelete.length) return;
    const resumeMovement = movement ? token.pauseMovement() : undefined;
    await actor.deleteEmbeddedDocuments("ActiveEffect", toDelete);
    await resumeMovement?.();
  }

  /* ---------------------------------------- */

  /** @override */
  static events = {
    [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#onTokenEnter,
    [CONST.REGION_EVENTS.TOKEN_EXIT]: this.#onTokenExit,
  };

  /* ---------------------------------------- */

  /** @inheritDoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    if (!this.behavior.active || !("system" in changed)) return;
    this.#recreateEffectsForAllTokens();
  }

  /* ---------------------------------------- */

  /**
   * Recreate the effects of tokens within the region.
   * @returns {Promise<void>}
   */
  async #recreateEffectsForAllTokens() {
    const effects = await Promise.all(this.effects.map(fromUuid));
    const operations = [];
    for (const token of this.region.tokens) {
      const actor = token.actor;
      if (!actor) continue;
      const toDelete = this.#getEffectsToDelete(actor);
      if (toDelete.length) {
        operations.push({
          action: "delete",
          documentName: "ActiveEffect",
          ids: toDelete,
          parent: actor
        });
      }
      // TORG START
      if (this.disposition !== TorgApplyEffectRegionBehaviorType.NO_DISPOSITION &&
        token.disposition !== this.disposition) continue;
      // Don't apply the effect if this is the token generating the aura
      if (token.attachments.regions.has(this.region)) continue;
      // TORG FINISH
      const toCreate = this.#getEffectsToCreate(actor, effects);
      if (toCreate.length) {
        operations.push({
          action: "create",
          documentName: "ActiveEffect",
          data: toCreate,
          parent: actor
        });
      }
    }
    await foundry.documents.modifyBatch(operations);
  }

  /* ---------------------------------------- */

  /**
   * Get Active Effects that should be created for the Actor.
   * @param {Actor} actor             The actor the Active Effects should be created for.
   * @param {ActiveEffect[]} effects  The effects the Active Effects are created from.
   * @returns {ActiveEffectData[]}    The data of Active Effects that should be created.
   */
  #getEffectsToCreate(actor, effects) {
    const toCreate = [];
    for (const effect of effects) {
      const data = effect.toObject();
      delete data._id;
      if (effect.compendium) {
        data._stats.duplicateSource = null;
        data._stats.compendiumSource = effect.uuid;
      } else {
        data._stats.duplicateSource = effect.uuid;
        data._stats.compendiumSource = null;
      }
      data._stats.exportSource = null;
      data.origin = this.behavior.uuid;
      toCreate.push(data);
    }
    return toCreate;
  }

  /* ---------------------------------------- */

  /**
   * Get Active Effects that should be deleted from the Actor.
   * @param {Actor} actor  The actor the Active Effects should be deleted from.
   * @returns {string[]}   The IDs of Active Effects that should be deleted.
   */
  #getEffectsToDelete(actor) {
    return actor.effects.reduce((ids, effect) => {
      if (effect.origin === this.behavior.uuid) ids.push(effect.id);
      return ids;
    }, []);
  }
}