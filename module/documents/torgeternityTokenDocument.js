export default class TorgEternityTokenDocument extends foundry.documents.TokenDocument {

  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // change the generic threat token to match the cosm's one if it's set in the scene

    if (this.texture.src.includes('systems/torgeternity/images/characters/threat')) {
      const cosm = canvas.scene.torg.cosm;
      // not cosmTypes, because that includes 'none'
      if (cosm && Object.hasOwn(CONFIG.torgeternity.cosmDecks, cosm))
        this.updateSource({ 'texture.src': 'systems/torgeternity/images/characters/threat-' + cosm + '.Token.webp' });
    }
  }

  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    if (game.user.id !== userId) return;

    if (game.release.generation > 13 && game.user.isActiveGM) this.updateEffectRegions();
  }

  updateEffectRegions = foundry.utils.debounce(this.#updateEffectRegions.bind(this), 100);

  async #updateEffectRegions() {

    // Object:
    //   key = effect UUID
    //   property = region UUID
    const oldMapping = JSON.parse(this.flags?.torgeternity?.emanations ?? "{}");
    let changed = false;

    // Which effects still exist on the token/actor?
    // (We use !disabled rather than active since the emanation might have conditional fields in it)
    const emanations = {};
    for (const effect of this.actor.allApplicableEffects())
      if (!effect.disabled && effect.system.emanation.radius)
        emanations[effect.uuid] = effect;

    for (const [effectUuid, regionUuid] of Object.entries(oldMapping)) {
      const region = await fromUuidSync(regionUuid, { strict: false });
      if (!emanations[effectUuid]) {
        // The region should no longer exist
        if (region) {
          // Deleting the region without first deleting the behaviors does NOT generate TOKEN_EXIT events! (V14.360 bug)
          for (const behavior of region.behaviors)
            await behavior.delete();
          await region.delete();
        }
        delete oldMapping[effectUuid];
        changed = true;
      } else if (!region) {
        // Somehow the region got deleted without our mapping being updated, so update the mapping.
        delete oldMapping[effectUuid];
        changed = true;
      } else if (region) {
        // Check for change of radius
        const emanation = emanations[effectUuid].system.emanation;
        const newRadius = emanation.radius / canvas.scene.grid.distance * this.parent.dimensions.distancePixels;
        const curRadius = region.shapes[0].radius;
        const updates = {};
        if (curRadius !== newRadius) {
          const shape = { ...region.shapes[0] };
          shape.radius = newRadius;
          updates.shapes = [shape];
        }
        if (Number(region.color) !== Number(emanation.color)) {
          updates.color = emanation.color;
        }
        if (region.visibility !== emanation.visibility) {
          updates.visibility = emanation.visibility;
        }
        // no change of disposition allowed (yet)
        if (!foundry.utils.isEmpty(updates)) await region.update(updates);
        // Check for change of disposition
        for (const behavior of region.behaviors) {
          if (behavior.system.disposition !== emanation.disposition) {
            await behavior.update({ 'system.disposition': emanation.disposition });
            // Revalidate all tokens within the region
            if (behavior.active) {
              for (const token of region.tokens) {
                behavior._handleRegionEvent({
                  name: CONST.REGION_EVENTS.TOKEN_EXIT,
                  data: { token, movement: null },
                  region: region,
                  user: game.user
                });
                behavior._handleRegionEvent({
                  name: CONST.REGION_EVENTS.TOKEN_ENTER,
                  data: { token, movement: null },
                  region: region,
                  user: game.user
                });
              }
            }
          }
        }
      }
    }

    // Create any regions which don't already exist
    for (const [uuid, effect] of Object.entries(emanations))
      if (!oldMapping[uuid]) {
        oldMapping[uuid] = await this.createTokenEmanation(effect);
        changed = true;
      }

    // Update mapping
    if (changed) await this.update({ 'flags.torgeternity.emanations': JSON.stringify(oldMapping) });
  }

  /**
   * Foundry V14
   */
  async createTokenEmanation(effect) {
    const emanation = effect.system.emanation;

    const region = await CONFIG.Region.documentClass.createTokenEmanation(
      this,
      emanation.radius / canvas.scene.grid.distance,
      { // RegionData
        name: `${effect.name} (${this.name})`,
        restriction: { enabled: true },
        color: emanation.color,
        // opacity: emanation.opacity,   // no support for opacity yet?
        displayMeasurements: true,
        visibility: emanation.visibility,
        ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
      },
      { gridBased: true })

    if (!region) return console.error('failed to create region document');

    const behavior = await CONFIG.RegionBehavior.documentClass.create(
      {
        name: this.name,
        type: 'torgApplyEffect',
        // Core doesn't support choosing one disposition over another
        system: {
          effects: [effect.uuid],
          disposition: emanation.disposition
        }
      },
      { parent: region });

    return region.uuid;
  }
}