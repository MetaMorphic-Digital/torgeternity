const fields = foundry.data.fields;
const { AdjustDarknessLevelRegionBehaviorType } = foundry.data.regionBehaviors;

const NO_AXIOMS = { magic: 0, social: 0, spirit: 0, tech: 0 };

const DEFAULT_TORG = {
  cosm: 'none',
  cosm2: 'none',
  zone: 'pure',
  dimLightThreshold: 0.2,
  darkThreshold: 0.7,
  axioms: NO_AXIOMS
}

/*
 * No DataModel available for CONFIG.Scene 
 */
export default class TorgeternityScene extends foundry.documents.Scene {

  _initializeSource(data, options) {
    if (!Object.hasOwn(data, "flags")) data.flags = {};
    if (!Object.hasOwn(data.flags, "torgeternity"))
      data.flags.torgeternity = DEFAULT_TORG;
    else {
      if (!data.flags.torgeternity.dimLightThreshold) {
        data.flags.torgeternity.dimLightThreshold = DEFAULT_TORG.dimLightThreshold;
        data.flags.torgeternity.darkThreshold = NO_AXIOMS;
      }
      if (!data.flags.torgeternity.axioms)
        data.flags.torgeternity.axioms = DEFAULT_TORG.axioms;
    }
    return super._initializeSource(data, options);
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    const flags = this.flags?.torgeternity ?? DEFAULT_TORG;
    if (flags) {
      this.torg = {
        cosm: this.flags.torgeternity.cosm,
        zone: this.flags.torgeternity.zone,
        displayCosm2: (this.flags.torgeternity.zone !== 'pure'),
        isMixed: (this.flags.torgeternity.zone === 'mixed'),
        cosm2: (this.flags.torgeternity.zone !== 'pure') && this.flags.torgeternity.cosm2,
        otherName1: this.flags.torgeternity.otherName1 ?? null,
        otherName2: this.flags.torgeternity.otherName2 ?? null,
        axioms: flags.axioms
      };
    }
  }

  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    // Ensure prepared data (e.g. zone axioms) are updated on all actors in the scene)
    if (changed.flags?.torgeternity) prepareAllActors();
  }

  // A general function that would normally be static
  static getAxioms(cosm, cosm2, zone) {
    const zoneAxioms = { ...(CONFIG.torgeternity.axiomByCosm[cosm] ?? NO_AXIOMS) };
    if (zone === 'mixed' && cosm2) {
      const axiom2 = CONFIG.torgeternity.axiomByCosm[cosm2] ?? NO_AXIOMS;
      for (const key of Object.keys(zoneAxioms))
        if (axiom2[key] > zoneAxioms[key]) zoneAxioms[key] = axiom2[key];
    }
    return zoneAxioms;
  }

  /**
   * Returns true if the given 'cosm' is active within the zone of this scene.
   * (Either the single or dominant zone, or either cosm if mixed)
   * @param {String} cosm 
   * @returns 
   */
  hasCosm(cosm) {
    return this.torg.cosm === 'none' || this.torg.cosm === cosm || (this.torg.isMixed && this.torg.cosm2 === cosm);
  }

  /**
   * Update the various darkness penalty statuses on the token based on the scene's darkness level and any nearby light sources.
   * 
   * Derived from https://github.com/kristianserrano/swade-illuminator
   * @param {Token} token 
   * @returns either null or one of the keys from CONFIG.torgeternity.darknessModifiers (none, dim, dark, pitchBlack)
   */
  getTokenDarknessPenalty(token) {
    if (!token || !game.scenes.current?.tokenVision) return null;

    // Get the scene's thresholds for Dim Light, Darkness, and Pitch Dark (Global Illumination Threshold in FVTT terms).
    const pitchBlackLevel = game.scenes.current.environment.globalLight.darkness.max;
    const dimLevel = Number(game.scenes.current.flags?.torgeternity?.dimLightThreshold ?? 0);
    const darkLevel = Number(game.scenes.current.flags?.torgeternity?.darkThreshold ?? 0);

    // Get scene darkness level at the given point (ignoring light sources).
    let pointDarknessLevel = canvas.effects.getDarknessLevel(token.position);
    // Check for regions with an active "Adjust Darkness Level" behavior.
    for (const region of token.document.regions) {
      for (const behavior of region.behaviors) {
        if (behavior.active && behavior.type === 'adjustDarknessLevel') {
          // AbstractDarknessLevelRegionShader#darknessLevel
          const M = AdjustDarknessLevelRegionBehaviorType.MODES;
          switch (behavior.system.mode) {
            case M.OVERRIDE:
              pointDarknessLevel = behavior.system.modifier;
              break;
            case M.BRIGHTEN:
              pointDarknessLevel = canvas.environment.darknessLevel * (1 - behavior.system.modifier);
              break;
            case M.DARKEN:
              pointDarknessLevel = 1 - ((1 - canvas.environment.darknessLevel) * (1 - behavior.system.modifier));
              break;
            default: throw new Error("Invalid mode");
          }
        }
      }
    }

    let sceneLevel =
      (pointDarknessLevel >= pitchBlackLevel) ? 'pitchBlack' :
        (pointDarknessLevel >= darkLevel) ? 'dark' :
          (pointDarknessLevel >= dimLevel) ? 'dim' :
            null;

    // If inside a darkness "light", then that overrides any other lighting.
    const tokcent = Object.values(token.center);
    if (canvas.effects.darknessSources.some((src) => src.active && !src.isPreview && src.shape.contains(...tokcent)))
      return 'pitchBlack';

    // If the token has a bright light (or global is bright), then it is easily visible.
    if (token.document.light.bright > 0 || sceneLevel === null)
      return null;

    // For any light sources, check if in the BRIGHT or DIM part of the light.
    let proximityDimLight = false;
    const lights = canvas.effects.lightSources.filter((src) => !(src instanceof foundry.canvas.sources.GlobalLightSource) && src.active && !src.isPreview && src.shape.contains(...tokcent));
    if (lights.length) {
      // Use the bounds of the bright part of the light, accounting for walls.
      const inBright = lights.some(light => {
        const { data: { x, y }, ratio } = light;
        const bright = foundry.canvas.geometry.ClockwiseSweepPolygon.create({ x, y }, {
          type: 'light',
          boundaryShapes: [new PIXI.Circle(x, y, ratio * light.shape.config.radius)]
        });
        return bright.contains(...tokcent);
      });

      // If in bright light, then no further checks required.
      if (inBright) return null;
      proximityDimLight = true;
    }

    // If the token doesn't have any light source, then let's define which Darkness penalty to apply, if any.
    if (token.document.light.dim > 0 || proximityDimLight)
      return 'dim';

    return sceneLevel;
  }
}

/**
 * Ensure Zone Axioms are correct when tokens are created or the scene is changed.
 */
function prepareAllActors() {
  if (!game.scenes.active?.tokens) return;
  game.scenes.active.tokens.forEach(token => token.actor?.reset());
}

Hooks.on('ready', prepareAllActors);
Hooks.on('canvasReady', prepareAllActors);
Hooks.on('createToken', (token) => token.actor?.reset());