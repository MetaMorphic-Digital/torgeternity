import TorgeternityActor from '../documents/actor/torgeternityActor.js';

export default class TorgEternityToken extends foundry.canvas.placeables.Token {

  static #originToken;
  static #hoverToken;
  static #label;
  #debounceDarkness;

  constructor(document) {
    super(document);
    this.#debounceDarkness = foundry.utils.debounce(this.updateDarknessStatus.bind(this), 100);
  }

  _refreshVisibility() {
    super._refreshVisibility();

    if (!game.settings.get('torgeternity', 'autoDarknessPenalty')) return;
    if (this.scene !== game.scenes.active || !this.scene.tokenVision) return;
    if (this.isDragged || this.isPreview || !game.user.isActiveGM) return;

    //console.log(`_refreshVisibility ${this.name}`)
    this.#debounceDarkness();
  }

  async updateDarknessStatus() {
    const actor = this.actor;
    if (!this.actor || !this.scene) return;
    const darkness = this.scene.getTokenDarknessPenalty(this);
    //console.log(`${this.name}: new darkness state = ${darkness}`)

    for (const status of Object.keys(CONFIG.torgeternity.darknessModifiers)) {
      if (actor.statuses.has(status) && status !== darkness) {
        //console.log(`${this.name}: disabling status '${status}'`)
        await actor.toggleStatusEffect(status);
      }
    }
    if (darkness && !actor.statuses.has(darkness)) {
      //console.log(`${this.name}: enabling status '${darkness}'`)
      await actor.toggleStatusEffect(darkness);
    }
  }

  _onHoverIn(event, options) {
    const result = super._onHoverIn(event, options)
    if (!game.settings.get('torgeternity', 'hoverDistance') || !this.visible) return result;
    if (!canvas.tokens.active || game.activeTool !== "select") return result;

    const originActor = TorgeternityActor.getControlledActor();
    if (!originActor) return result;
    const originToken = canvas.scene.tokens.find(t => t.actor === originActor);
    if (!originToken || originToken.object === this) return;

    TorgEternityToken.#originToken = originToken;
    TorgEternityToken.#hoverToken = this;
    this.updateLabel();

    // Ensure it is visible
    TorgEternityToken.#label?.classList.toggle('hidden', false);
    return result;
  }

  _onHoverOut(event, options) {
    const result = super._onHoverOut(event, options);
    if (!TorgEternityToken.#label) return result;  // never created if option is disabled

    // Hide the label, and mark no hover in progress.
    TorgEternityToken.#label?.classList.toggle('hidden', true);
    TorgEternityToken.#hoverToken = null;
    return result;
  }

  applyRenderFlags() {
    super.applyRenderFlags();
    if (this === TorgEternityToken.#hoverToken) this.updateLabel();
  }

  updateLabel() {
    // Token was made hidden while the hover was already active.
    if (!this.visible) {
      TorgEternityToken.#label?.classList.toggle('hidden', true);
      TorgEternityToken.#hoverToken = null;
      return;
    }

    // Create label if it doesn't already exist
    if (!TorgEternityToken.#label) {
      const token = TorgEternityToken.#hoverToken;
      let rulerId = `token-distance-${token.document.id}`;
      if (token.isPreview) rulerId += "-preview";

      let label = document.querySelector(`#hud #measurement #${rulerId}`);
      if (!label) {
        label = document.createElement("div");
        label.classList.add("ruler-labels", "token-ruler-labels");
        if (!token.visible) label.classList.add('hidden');
        label.id = rulerId;
      }
      TorgEternityToken.#label = label;
    }
    // Ensure the label has the relevant parent
    const label = TorgEternityToken.#label;
    if (!label.parent) document.querySelector("#hud #measurement")?.appendChild(label);

    // Determine the distance from the origin to this token.
    let distance = canvas.grid.measurePath([TorgEternityToken.#originToken.object.center, this.center]).distance;
    // Account for distance needing to be from edge to edge of token, with touching tokens having a distance of 1.
    distance -= (TorgEternityToken.#originToken.height + this.document.height) / 2 - 1;
    if (distance < 0) distance = 0;

    //console.log(`show distance from ${TorgEternityToken.#originToken.name} to ${token.name}`, distance)

    // Create the label HTML
    const distLabel = distance.toNearest(0.1).toLocaleString(game.i18n.lang);
    let html = `<div class="waypoint-label token-distance last"><span class="total-measurement">${distLabel} ${canvas.grid.units}</span></div>`;
    html = foundry.utils.parseHTML(html);
    html.style.setProperty("--position-x", `${this.center.x}px`);
    // 50 to get text ABOVE the top of the token
    html.style.setProperty("--position-y", `${this.center.y - 0.6 * this.h - (50 * canvas.dimensions.uiScale)}px`);
    html.style.setProperty("--ui-scale", canvas.dimensions.uiScale);

    // Update the displayed label
    label.replaceChildren(html);
  }

  /* Change the logic for setting the isTurn flag */
  _refreshTurnMarker() {

    // Should a Turn Marker be active?
    const { TokenTurnMarker } = foundry.canvas.placeables.tokens;

    const { turnMarker } = this.document;
    const markersEnabled = CONFIG.Combat.settings.turnMarker.enabled
      && (turnMarker.mode !== CONST.TOKEN_TURN_MARKER_MODES.DISABLED);
    const isTurn = this.combatant && game.combat.started &&
      game.combat?.currentDisposition === this.document?.disposition && !this.combatant.turnTaken && !this.combatant.isWaiting;
    const markerActive = markersEnabled && isTurn;

    // Activate a Turn Marker
    if (markerActive) {
      if (!this.turnMarker) this.turnMarker = this.addChildAt(new TokenTurnMarker(this), 0);
      canvas.tokens.turnMarkers.add(this);
      this.turnMarker.draw();
    }

    // Remove a Turn Marker
    else if (this.turnMarker) {
      canvas.tokens.turnMarkers.delete(this);
      this.turnMarker.destroy();
      this.turnMarker = null;
    }
  }
}