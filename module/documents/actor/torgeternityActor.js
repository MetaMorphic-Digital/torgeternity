import TorgActiveEffect from '../active-effect/torgActiveEffect.js';
import { TestDialog } from '../../test-dialog.js';
import { TestResult } from '../../torgchecks.js';
import TorgeternityItem from '../item/torgeternityItem.js';

const { DialogV2 } = foundry.applications.api;

/**
 *
 */
let deferredDrivers = new Set();

export default class TorgeternityActor extends foundry.documents.Actor {
  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */
  prepareBaseData() {
    super.prepareBaseData();
    // Allow custom skills to be modified by Active Effects
    this.system.customSkills = {};
    for (const custom of this.itemTypes.customSkill) {
      this.system.customSkills[custom.name.slugify()] = custom.system;
    }
  }

  /**
   * simple getter for the equipped armor item
   *
   * @returns {Item|null}
   */
  get equippedMelee() {
    return this.itemTypes.meleeweapon.find((a) => a.isEquipped) ?? null;
  }

  get equippedMelees() {
    return this.itemTypes.meleeweapon.filter((a) => a.isEquipped) ?? null;
  }

  get race() {
    return this.itemTypes.race[0] ?? null;
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * On creation of a stormknight, create a corresponding card hand.
   * @inheritDoc
   */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    // by default creating a  hand for each stormknight
    if (this.type === 'stormknight' && game.user.isActiveGM) {
      this.createDefaultHand();
    }
  }

  /**
   * As per core Actor#modifyTokenAttribute but do NOT clamp the value when modifying shock or wounds
   * @inheritDoc
   */
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    // clamping is performed when isBar is true
    if (attribute === 'shock' || attribute === 'wounds')
      return super.modifyTokenAttribute(`${attribute}.value`, value, isDelta, false);
    else
      return super.modifyTokenAttribute(attribute, value, isDelta, localIsBar);
  }

  /**
   * 
   * @inheritDoc
   */
  async _preUpdate(changed, options, user) {
    const isFullReplace = !((options.diff ?? true) && (options.recursive ?? true));
    if (!changed.system || isFullReplace) {
      return super._preUpdate(changed, options, user);
    }

    if (changed.img && !changed.prototypeToken?.texture?.src) {
      const oldimg = this.prototypeToken.texture.src;
      let updateToken;
      if (changed.img === oldimg || this.img === oldimg) {
        updateToken = true;
      } else {
        // Check for default image
        switch (this.type) {
          case 'stormknight':
            updateToken = (oldimg === 'icons/svg/mystery-man.svg');
            break;
          case 'threat':
            // Threats might have been changed to show a cosm-specific ring.
            updateToken = oldimg.startsWith('systems/torgeternity/images/characters/threat');
            break;
          case 'vehicle':
            updateToken = (oldimg === 'systems/torgeternity/images/characters/vehicle-land.webp');
            break;
        }
      }
      if (updateToken) {
        if (this.isToken)
          this.token.update({ "texture.src": changed.img });
        else
          this.updateSource({ "prototypeToken.texture.src": changed.img })
      }
    }
    // Apply attribute maximums
    if (this.type === 'stormknight') {
      for (const [attribute, { maximum }] of Object.entries(this?.system?.attributes)) {
        const changedAttribute = changed.system.attributes?.[attribute];
        if (typeof changedAttribute?.base === 'number') {
          const clampedAttribute = Math.clamp(changedAttribute.base, 0, maximum);
          if (changedAttribute.base > clampedAttribute) {
            changedAttribute.base = clampedAttribute;
            ui.notifications.error(
              _loc('torgeternity.notifications.reachedMaximumAttr')
            );
          }
        }
      }
    }

    // Check for exceeding shock or wounds
    if (this.type !== 'vehicle' &&
      changed.system.shock?.value !== undefined &&
      changed.system.shock?.max === undefined) {
      if (changed.system.shock.value > this.system.shock.max) {
        // value will be clamped in prepareDerivedData
        options.shockExceeded = true;
      } else if (changed.system.shock.value < 0)
        changed.system.shock.value = 0;
    }
    if (changed.system.wounds?.value !== undefined &&
      changed.system.wounds.max === undefined) {
      if (changed.system.wounds.value > this.system.wounds.max) {
        // value will be clamped in prepareDerivedData
        options.woundsExceeded = true;
      } else if (changed.system.wounds.value < 0)
        changed.system.wounds.value = 0;
    }

    return super._preUpdate(changed, options, user);
  }

  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (this.type === 'stormknight') {
      const hand = this.getDefaultHand();
      // If the update includes permissions, sync them to the hand
      if (hand && changed.ownership && game.userId === userId) {
        // DO NOT PUT ANYTHING ELSE IN THIS UPDATE! diff:false, recursive:false can easily nuke stuff
        hand.update({ ownership: this.getHandOwnership() }, { diff: false, recursive: false });
      }
    }

    // Skip most of the rest if we didn't make the update
    // although we need to update the player list after all other changes if possibilities have changed.
    if (game.userId === userId) {
      /* Check for exceeding shock and/or wounds */
      let setUnconscious;

      if (options.woundsExceeded) {
        if (options.nonLethal) // nonLethal damage will only KO, not kill (no defeat test for SKs)
          setUnconscious = true;
        else if (this.type === 'stormknight')
          this.notifyDefeat();
        else if (game.settings.get('torgeternity', 'autoWound'))
          this.toggleStatusEffect('dead', { active: true, overlay: true });
      }

      if (options.shockExceeded && game.settings.get('torgeternity', 'autoShock'))
        setUnconscious = true;

      if (setUnconscious && !this.hasStatusEffect('dead') && !this.hasStatusEffect('unconscious'))
        this.toggleStatusEffect('unconscious', {
          active: true,
          overlay: true,
        }).then(effect => effect.update({
          start: { time: game.time.worldTime },
          duration: { value: 30, units: 'minutes' }
        }))

      if (options.woundsExceeded || options.shockExceeded) {
        const updates = {};
        // Remove the exceeded Max values
        if (options.shockExceeded) updates['system.shock.value'] = this.system.shock.max;
        if (options.woundsExceeded) updates['system.wounds.value'] = this.system.wounds.max;
        this.update(updates);
      }
    }

    // Update player list if the number of possibilities has changed.
    if (changed.system?.other && 'possibilities' in changed.system.other) {
      ui.players?.render();
    }
  }

  applyActiveEffects(phase) {
    super.applyActiveEffects(phase);
    if (phase === 'final' && game.user.isActiveGM)
      this.getActiveSceneTokens().forEach(token => token?.document?.updateEffectRegions());
  }

  /**
   * When a stormknight is deleted, delete the corresponding player hand
   * @inheritDoc
   */
  _onDelete(options, userId) {
    if (this.type === 'stormknight' && game.user.isActiveGM)
      this.getDefaultHand()?.delete();
    super._onDelete(options, userId)
  }

  /**
   * @inheritdoc
   */
  get temporaryEffects() {
    // Called for display in the Combat Tracker, and to display effect icons on the Token.
    // effect.active might not be active due to the logic in TorgActiveEffectData.isSuppressed,
    // so apply an effect directly on an actor if it is suppressed.
    const effects = [];
    for (const effect of this.allApplicableEffects()) {
      // The effect might not be active
      if (!effect.disabled && (effect.parent === this || !effect.isSuppressed) && effect.isTemporary) effects.push(effect);
    }
    return effects;
  }
  /**
   * @returns {object|false} the Hand of the actor or false if no default hand is set
   */
  getDefaultHand() {
    return game.cards.find((c) => c.flags?.torgeternity?.defaultHand === this.id);
  }

  /**
   *
   */
  async createDefaultHand() {
    // creating a card hand then render it
    return Cards.create({
      name: this.name,
      type: 'hand',
      ownership: this.getHandOwnership(),
      flags: { torgeternity: { defaultHand: this.id } },
    });
  }

  /**
   * @returns {object} permission update object for use with the corresponding hand - which has the same owners as the SK, the default as observer, and deletes other permissions
   */
  getHandOwnership() {
    const handOwnership = foundry.utils.duplicate(this.ownership);
    for (const key of Object.keys(handOwnership)) {
      // remove any permissions that are not owner
      if (handOwnership[key] < CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
        delete handOwnership[key];
      }
      // set default permission to observer
      handOwnership.default = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
    }
    return handOwnership;
  }

  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    if (foundry.utils.hasProperty(data, 'prototypeToken')) {
      if (options.fromCompendium && game.settings.get('torgeternity', 'disableDynamicRingOnImport')) {
        await this.updateSource({ "prototypeToken.ring.enabled": false });
      }
      return;
    }

    switch (data.type) {
      case 'stormknight':
        await this.updateSource({
          prototypeToken: {
            sight: { enabled: true },
            actorLink: true,
            disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
            lockRotation: true,
            rotation: 0,
            texture: {
              src: data.img ?? 'icons/svg/mystery-man.svg',
              rotation: 0,
            },
            displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER,
            bar1: { attribute: 'wounds' },
            bar2: { attribute: 'shock' },
          }
        });
        break;

      case 'threat':
        await this.updateSource({
          img: data.img ?? 'systems/torgeternity/images/characters/threat.webp',
          prototypeToken: {
            sight: { enabled: true },
            actorLink: false,
            disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
            displayName: CONST.TOKEN_DISPLAY_MODES.OWNER,
            // Core parameters
            // appendNumber: true,
            // prependAdjective: true,
            lockRotation: true,
            rotation: 0,
            texture: {
              src: data.img ?? 'systems/torgeternity/images/characters/threat-generic.Token.webp',
              rotation: 0,
            },
            displayBars: CONST.TOKEN_DISPLAY_MODES.HOVER,
            bar1: { attribute: 'wounds' },
            bar2: { attribute: 'shock' },
          }
        });
        break;

      case 'vehicle':
        // Vehicles + other?
        await this.updateSource({
          img: 'systems/torgeternity/images/characters/vehicle-land.webp',
          prototypeToken: {
            sight: { enabled: true },
            //actorLink: false,
            disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
            lockRotation: true,
            rotation: 0,
            texture: {
              src: data.img ?? 'systems/torgeternity/images/characters/vehicle-land-Token.webp',
              rotation: 0,
            },
            displayBars: CONST.TOKEN_DISPLAY_MODES.HOVER,
            bar1: { attribute: 'wounds' },
            bar2: { attribute: '' },
          }
        });
        break;
    }
  }

  // appliedEffects used by CombatTracker and Token to determine which effects to display.
  get appliedEffects() {
    const effects = [];
    for (const effect of this.allApplicableEffects()) {
      if (effect.active || (!effect.disabled && effect.isTemporary)) effects.push(effect);
    }
    return effects;
  }

  /**
   * NOTE: Don't call during prepareBaseData, since applyActiveEffects might change the disconnected state.
   */
  get isDisconnected() {
    return this.statuses.has('disconnected') ?? false;
  }

  hasStatusEffect(statusId) {
    return this.statuses.has(statusId) ?? false;
  }

  get isConcentrating() {
    return this.system.statusModifiers.concentrating !== 0;
  }

  /**
   * Apply the supplied amount of shock and/or wound damage to this actor.
   * Supplying a negative number will act as healing.
   * 
   * @param {number} shock The amount of shock to inflict on this actor.
   * @param {number} wounds The number of wounds to inflict on this actor.
   * @returns {Promise<this>}
   */
  applyDamages(shock, wounds, options = {}) {
    let updates = {};
    let result = {};
    // Possibly modify by any AEs on the base Actor
    // No clamping of values
    if (shock && this.type !== 'vehicle') {
      const newvalue = this.system.shock.value + Math.max(0, shock + this.system.defenses.shock.mod);
      if (newvalue > this.system.shock.max) result.shockExceeded = true;
      updates['system.shock.value'] = newvalue;
    }
    if (wounds) {
      const newvalue = this.system.wounds.value + Math.max(0, wounds + this.system.defenses.wounds.mod);
      if (newvalue > this.system.wounds.max) result.woundsExceeded = true;
      updates['system.wounds.value'] = newvalue;
    }
    this.update(updates, options);
    return result;
  }

  async notifyDefeat() {
    const attribute = (this.system.attributes.spirit.value < this.system.attributes.strength.value) ? 'spirit' : 'strength';

    const html = `<p>${_loc('torgeternity.defeat.prompt', { name: this.name })}
    <div class="skill-roll-menu">
     <a class="button roll-button roll-defeat ${(attribute === 'strength') && 'notPreferred'}"
     data-action="testDefeat" data-control="spirit" }>
     ${_loc('torgeternity.attributes.spirit')}
     </a>
     <a class="button roll-button roll-defeat ${(attribute === 'spirit') && 'notPreferred'}" 
     data-action="testDefeat" data-control="strength" >
     ${_loc('torgeternity.attributes.strength')}
     </a>
     </div>`;

    return ChatMessage.implementation.create({
      speaker: ChatMessage.implementation.getSpeaker({ actor: this }),
      content: html
    })
  }
  /**
   * Very Stymied - self-imposed by Backlash3
   */
  async setVeryStymied(originid, duration = 1) {
    // apply Stymied, or veryStymied
    if (this.hasStatusEffect('stymied')) {
      await this.toggleStatusEffect('stymied', { active: false });
    }

    if (!this.hasStatusEffect('veryStymied')) {
      let eff = await this.toggleStatusEffect('veryStymied', { active: true });
      eff.update({
        origin: originid,
        duration: { value: duration, units: 'rounds', expiry: 'turnEnd' }
      })
    }
  }

  /**
   * Very Vulnerable - Self-imposed by performing an All-Out attack
   */
  async setVeryVulnerable(origin, duration = 1) {
    // take away vulnerable effect
    await this.toggleStatusEffect('vulnerable', { active: false });

    let effect = this.appliedEffects.find((d) => d.statuses.find((e) => e === 'veryVulnerable'));
    if (!effect) {
      effect = await this.toggleStatusEffect('veryVulnerable', { active: true });
    }
    // If no origin, then it is being self-applied so needs to last to after this actor's next turn
    effect.update({ origin, duration: { value: duration, units: 'rounds', expiry: 'turnEnd' } })
  }

  async increaseStymied(origin, duration = 1) {
    // apply Stymied, or veryStymied
    if (this.hasStatusEffect('veryStymied')) return;

    let statusId;
    if (this.hasStatusEffect('stymied')) {
      await this.toggleStatusEffect('stymied', { active: false });
      statusId = 'veryStymied';
    } else {
      statusId = 'stymied';
    }

    if (statusId) {
      const effect = await this.toggleStatusEffect(statusId, { active: true });
      effect.update({
        origin,
        duration: { value: duration, units: 'rounds', expiry: 'turnEnd' }
      })
    }
  }

  /**
   * increase Vulnerable effect one step, up to VeryVulnerable
   * @param targetuuid
   */
  async increaseVulnerable(originid, duration = 1) {
    // apply Vulnerable, or veryVulnerable
    let statusId;
    if (this.hasStatusEffect('veryVulnerable')) return;

    if (this.hasStatusEffect('vulnerable')) {
      await this.toggleStatusEffect('vulnerable', { active: false });
      statusId = 'veryVulnerable';
    } else {
      statusId = 'vulnerable';
    }
    if (statusId) {
      const effect = await this.toggleStatusEffect(statusId, { active: true });
      effect.update({
        origin: originid,
        duration: { value: duration, units: 'rounds', expiry: 'turnEnd' }
      })
    }
  }

  /**
   * Sets an Active Defense no an actor with the supplied bonus.
   * @param {Number} bonus 
   */
  async setActiveDefense(bonus) {

    const equippedShield = this.itemTypes.shield.find(item => item.isEquipped); // Search for an equipped shield
    let shieldBonus = (equippedShield && !this.hasStatusEffect('vulnerable') && !this.hasStatusEffect('veryVulnerable')) ? equippedShield.system.bonus : 0

    return this.createEmbeddedDocuments('ActiveEffect', [{
      name: 'ActiveDefense',
      img: 'icons/equipment/shield/heater-crystal-blue.webp', // To change I think, taken in Core, should have a dedicated file
      duration: { value: 0, units: 'rounds', expiry: 'roundEnd' },
      origin: this.uuid,
      changes: [
        {
          // Modify all existing "basic" defense in block
          key: 'system.defenses.activeDefense', // Should need other work for defense vs powers
          type: 'add',
          value: bonus, // that don't target xxDefense
          priority: 20, // Create a data.ADB that store the bonus ?
        },
        {
          // SHIELD bonus to Toughness
          key: 'system.defenses.toughness',
          type: 'add',
          value: shieldBonus,
          priority: 20,
        },
      ],
      disabled: false,
    }]);
  }

  /**
   * When the debounce has finished, update the darkness state of the first token on the given scene.
   */
  debounceDarkness = foundry.utils.debounce(async scene => {
    if (!scene.tokenVision || !game.user.isActiveGM) return;

    const tokens = this.getActiveTokens();
    if (!tokens) return;

    const darkness = scene.getTokenDarknessPenalty(tokens[0]);

    for (const status of Object.keys(CONFIG.torgeternity.darknessModifiers)) {
      if (status === 'none') continue;
      await this.toggleStatusEffect(status, { active: status === darkness });
    }
  }, CONFIG.torgeternity.darknessDebounceMS)  // Wait until not called for these MS before finally handling the token

  static migrateData(source) {
    if (source.type === 'vehicle' && typeof source.system?.operator?.name === 'string') {
      if (source.system.operator.name)
        deferredDrivers.add({ vehicleId: source._id, driverName: source.system.operator.name })
      if (source.system.operator.skillValue)
        source.system.operatorFixedSkill = parseInt(source.system.operator.skillValue)
      delete source.system.operator;
    }
    return super.migrateData(source);
  }

  /**
   * For a Player, returns the controlled character.
   * For a GM, returns the "first" selected (not targeted) token's actor.
   * @returns Actor | null
   */
  static getControlledActor() {
    return (game.user.isGM && game.canvas.tokens.controlled?.length) ? game.canvas.tokens.controlled[0].actor : game.user.character;
  }

  /**
   * Reduces the remaining duration of any ActiveEffects present directly on the Actor,
   * excluding ActiveDefense.
   * @returns {Promise} A Promise which resolves when all affected ActiveEffects have been changed.
   */
  decayEffects() {
    const toUpdate = [];
    const toDelete = [];
    for (const effect of this.effects.filter((e) => e.duration.expiry === 'turnEnd')) {
      if (effect.duration.value <= 1)
        toDelete.push(effect.id)
      else
        toUpdate.push({
          _id: effect.id,
          'duration.value': Math.max(0, effect.duration.value - 1),
        });
    }
    const promises = [];
    if (toUpdate.length) promises.push(this.updateEmbeddedDocuments('ActiveEffect', toUpdate));
    if (toDelete.length) promises.push(this.deleteEmbeddedDocuments('ActiveEffect', toDelete));
    return Promise.all(promises);
  }

  /**
   * @returns {TorgActiveEffect|undefined} Either the AE for the Active Defense currently on the target, or undefined.
   */
  get activeDefense() {
    return this.effects.find(ef => ef.name === 'ActiveDefense')
  }

  /**
   * Add a 'concentrating' status AE to this actor identifying the given item as the reason for the concentration.
   * @param {TorgeteternityItem} item 
   * @returns Promise<TorgActiveEffect>
   */

  async addConcentration(item) {
    const effect = (await ActiveEffect.fromStatusEffect('concentrating')).toObject();
    Object.assign(effect,
      {
        name: _loc('torgeternity.chatText.concentration.AEname', { item: item.name }),
        origin: item.uuid,
        description: _loc('torgeternity.chatText.concentration.AEdescription', {
          actor: this.name,
          itemName: item.name,
          itemType: _loc(CONFIG.Item.typeLabels[item.type])
        })
      })
    return ActiveEffect.implementation.create(effect, { parent: this });
  }

  _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
    super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
    if (game.user.id !== userId) return;

    if (parent === this) {
      // The newly added item might bestow more Items automatically
      let newitems = [];
      for (const bestower of documents) {
        if (!bestower.system?.itemsToBestow) continue;
        for (const itemdata of bestower.system.itemsToBestow) {
          const newitem = foundry.utils.duplicate(itemdata);
          newitem.system.bestowedBy = bestower.id;
          newitems.push(newitem);
        }
        if (bestower.system.itemsToBestow) {
          // Blank out the itemsToBestow field on the item stored on this Actor, to reduce Actor size
          bestower.update({ 'system.itemsToBestow': null })
        }
      }
      if (newitems.length) this.createEmbeddedDocuments('Item', newitems);
    }
  }

  /**
   * When a 'concentration' status is deleted from an Actor, look for any AEs on other actors
   * which have 'system.concentratingId' set to the UUID of the 'concentration' status AE.
   * All those AEs will be deleted (since the power is no longer being concentrated on).
   * @param {} parent 
   * @param {*} collection 
   * @param {*} documents 
   * @param {*} ids 
   * @param {*} options 
   * @param {*} userId 
   * @returns 
   */
  _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
    super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
    if (game.user.id !== userId) return;

    if (collection === 'effects') {
      // If 'concentration' is being cancelled, then delete any effects from other Actors which are being supported by that concentration.
      const concIds = documents.filter(eft => eft.statuses.has('concentrating')).map(doc => doc.uuid).filter(uuid => !!uuid);
      if (concIds.length) this.deleteConcentration(concIds);
    }
    if (parent === this) {
      // See if any items were bestowed by the document being deleted.
      const todelete = this.items.filter(item => item.system.bestowedBy && ids.includes(item.system.bestowedBy)).map(item => item.id);
      if (todelete.length) this.deleteEmbeddedDocuments('Item', todelete);
    }
  }

  async deleteConcentration(concIds) {
    for (const actor of game.actors)
      for (const effect of actor.effects)
        if (effect.system.concentratingId && concIds.includes(effect.system.concentratingId))
          await effect.delete();
  }

  /**
   * Return the defensive traits currently applicable for this actor, comprising:
   * - all traits on the equipped armour
   * - all traits on perks
   * (TBD: all traits added by AE on equipped items)
   */
  get defenseTraits() {
    const result = [];
    //if (!this.itemTypes.armor.find(item => item.isEquipped)) result.push('unarmored');
    if (this.system.defenses.armor === 0) result.push('unarmored');
    for (const item of this.items) {
      if ((item.type === 'armor' && item.isEquipped) ||
        item.type === 'perk' ||
        item.type === 'specialability' ||
        item.type === 'specialabilityRollable') {
        result.push(...item.system.traits.filter(trait => Object.hasOwn(CONFIG.torgeternity.defenseTraits, trait)));
      }
    }
    return result.concat(Array.from(this.statuses)).concat(Array.from(this.system.extraTraits));
  }

  /**
   * Returns the scene's axioms, as they apply to THIS actor.
   * The axioms might be modified due to various things (Regions, Active Effects, etc.)
   */
  get zoneAxioms() {
    const systemAxioms = this.system.zoneAxioms;
    if (systemAxioms) return systemAxioms;
    // No subtype specific zone Axioms, so just use generic scene axioms.
    return game.scenes.active?.torg.axioms;
  }

  /**
   * As Actor#getActiveTokens, but return the tokens for the ACTIVE scene rather than the CURRENT scene
   */
  getActiveSceneTokens(linked = false, document = false) {
    if (!canvas.ready || !game.scenes.active) return [];
    const tokens = [];
    for (const t of this.getDependentTokens({ linked, scenes: game.scenes.active })) {
      if (t !== canvas.scene.tokens.get(t.id)) continue;
      if (document) tokens.push(t);
      else if (t.rendered) tokens.push(t.object);
    }
    return tokens;
  }

  /* ITEM UNIQUNESS HANDLING */
  checkItemUniqueness(crud) {
    this.items.forEach(item => item.tooMany = false);
    for (const [key, value] of Object.entries(CONFIG.torgeternity.itemUniqueness)) {
      const items = this.items.filter(item => !item.isDropped && item.system.traits.has(key));
      if (items.length === 0) continue;
      if ((value.maxCarried && items.length > value.maxCarried) ||
        (value.maxEquipped && items.filter(item => item.isEquipped).length > value.maxEquipped))
        items.forEach(item => item.tooMany = true);
    }
    // Max attunable handled separately (and does not care about the "dropped" state)
    const attunedItems = this.items.filter(item => item.system.traits.has('attunable') && item.system.attuned);
    if (attunedItems.length > this.system.maxAttunable)
      attunedItems.forEach(item => item.tooMany = true);
    const notAttuned = this.items.filter(item => item.system.traits.has('attunable') && !item.system.attuned);
    notAttuned.forEach(item => item.tooMany = true);
  }

  /**
   * @inheritDoc 
   * NOTE: Needs to set "disconnected" state before applying active effects or setting base data for armor/shield.
   * */
  prepareEmbeddedDocuments() {
    if (this.isLazyDelta) return; // Don't trigger ActorDelta preparation
    //super.prepareEmbeddedDocuments();  // call grandparent
    // START TORG
    // super.super.prepareEmbeddedDocuments()
    for (const collectionName of Object.keys(this.constructor.hierarchy || {})) {
      for (const e of this.getEmbeddedCollection(collectionName)) {
        e._safePrepareData();
      }
    }
    // Ensure the "disconnected" state is set BEFORE we set up the BaseData based on equipped armour/weapons.
    for (const effect of this.allApplicableEffects())
      if (effect.active && effect.statuses.has('disconnected'))
        this.statuses.add('disconnected');
    this.system.prepareEquippedData?.();
    // END TORG
    this.applyActiveEffects("initial");
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.checkItemUniqueness('prepareDerivedData');
    // Recalculate value for each custom skill (in case AEs were applied to 'system.customSkill.slug')
    for (const custom of this.itemTypes.customSkill) {
      custom.system.recalcValue();
    }
  }

  //
  // Various ROLL actions
  //

  /**
   * Roll an Attack test
   * @param {TorgeternityItem} item The item being used for the attack.
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollAttack(item, options = {}) {
    const weaponData = item.system;
    const skillName = weaponData.attackWith;
    let skillValue;
    let skillData;
    let attributes;

    if (item?.weaponWithAmmo && !item.hasAmmo) {
      ui.notifications.warn(_loc('torgeternity.chatText.noAmmo'));
      return;
    }

    if (this.type === 'vehicle') {
      skillData = item.system.gunnerSkill;
      skillValue = skillData?.value ?? '-';
      attributes = item.system.gunner?.system.attributes ?? 0;
    } else {
      skillData = this.system.skills[skillName];
      skillValue = skillData.value;
      attributes = this.system.attributes;
      if (isNaN(skillValue)) {
        skillValue = skillData.unskilledUse ? attributes[skillData.baseAttribute].value : '-';
      }
    }

    if (this.preventUnskilled(skillValue, skillName)) return;

    let dnDescriptor = 'standard';

    if (game.user.targets.size) {
      const firstTarget = game.user.targets.find(token => token.actor.type !== 'vehicle')?.actor ||
        game.user.targets.first().actor;

      if (firstTarget.type === 'vehicle') {
        dnDescriptor = 'targetVehicleDefense';
      } else {
        switch (skillName) {
          case 'meleeWeapons':
          case 'unarmedCombat':
            dnDescriptor = firstTarget.equippedMelee ? 'targetMeleeWeapons' : 'targetUnarmedCombat';
            break;
          case 'fireCombat':
          case 'energyWeapons':
          case 'heavyWeapons':
          case 'missileWeapons':
            dnDescriptor = 'targetDodge';
            break;
          default:
            dnDescriptor = 'targetMeleeWeapons';
        }
      }
    }

    // Calculate damage caused by this weapon
    let adjustedDamage = parseInt(weaponData.damage) + (skillData.damageMod ?? 0);
    switch (weaponData.damageType) {
      case 'flat':
        break;
      case 'strengthPlus':
        adjustedDamage += attributes.strength.value + attributes.strength.damageMod;
        break;
      case 'charismaPlus':
        adjustedDamage += attributes.charisma.value + attributes.charisma.damageMod;
        break;
      case 'dexterityPlus':
        adjustedDamage += attributes.dexterity.value + attributes.dexterity.damageMod;
        break;
      case 'mindPlus':
        adjustedDamage += attributes.mind.value + attributes.mind.damageMod;
        break;
      case 'spiritPlus':
        adjustedDamage += attributes.spirit.value + attributes.spirit.damageMod;
        break;
    }
    let weaponAP = weaponData.ap;

    const ammo = weaponData.loadedAmmo && this.items.get(weaponData.loadedAmmo)?.system;
    if (ammo) {
      if (ammo.damageMod) adjustedDamage += ammo.damageMod;
      if (ammo.apMod) weaponAP += ammo.apMod;
    }

    return TestDialog.wait({
      testType: 'attack',
      DNDescriptor: dnDescriptor,
      actor: this,
      itemId: item.id,
      amountBD: 0,
      isAttack: true,
      isFav: skillData?.isFav || false,
      skillName: skillName,
      skillValue: Math.max(skillValue, attributes[skillData?.baseAttribute]?.value || 0),
      unskilledUse: true,
      damage: adjustedDamage,
      weaponAP: weaponAP,
      applyArmor: true,
      applySize: true,
      attackOptions: true,
      chatNote: weaponData.chatNote,
      bdDamageSum: 0,
    }, { useTargets: true, ...options });
  }

  /**
   * Make a check for the use of a Power
   * @param {TorgeternityItem} item The power being tested
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollPower(item, options = {}) {
    const powerData = item.system;
    const skillName = powerData.skill;
    const skillData = this.system.skills[skillName];

    // Set modifier for this power
    const powerModifier = item.system.modifier || 0;

    if (this.preventUnskilled(skillData.value, skillName)) return;

    return TestDialog.wait({
      testType: 'power',
      DNDescriptor: powerData.dn,
      actor: this,
      itemId: item.id,
      powerName: item.name,
      powerModifier: powerModifier,
      isAttack: powerData.isAttack,
      isFav: skillData.isFav,
      skillName: skillName,
      skillValue: Math.max(skillData.value, this.system.attributes[skillData.baseAttribute].value),
      unskilledUse: false,
      damage: powerData.damage + this.system.attributes[skillData.baseAttribute].damageMod + (skillData.damageMod ?? 0),
      weaponAP: powerData.ap,
      applyArmor: powerData.applyArmor,
      applySize: powerData.applySize,
      attackOptions: true,
      amountBD: 0,
      bdDamageSum: 0,
    }, { useTargets: true, ...options });
  }

  /**
   * Roll an attribute test.
   * @param {String} attributeName The internal name of the attribute being tested.
   * @param {TorgeternityItem} item An optional item involved in the attribute test.
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollAttribute(attributeName, item, options = {}) {
    return TestDialog.wait({
      testType: 'attribute',
      actor: this,
      itemId: item?.id,
      skillName: attributeName,
      skillValue: this.system.attributes[attributeName].value,
      isFav: this.system.attributes[attributeName].isFav,
    }, { useTargets: true, ...options });
  }

  /**
   * Roll a skill test
   * @param {String} skillName The internal name of the skill being tested.
   * @param {*} item An optional item for which the test is being made.
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollSkill(skillName, item, options = {}) {

    const skillData = this.system.skills[skillName] ?? this.system.customSkills[skillName] ?? this.items.get(skillName)?.system;
    if (!skillData) return;

    // Before calculating roll, check to see if it can be attempted unskilled; exit test if actor doesn't have required skill
    if (this.preventUnskilled(skillData.value, skillName)) return;
    let testType = 'skill';

    // Check if character is trying to roll on reality while disconnected- must be allowed if reconnection-roll
    if (skillName === 'reality' && this.isDisconnected) {
      testType = 'reconnect';
      const confirmed = await DialogV2.confirm({
        window: { title: 'torgeternity.dialogWindow.realityCheck.title' },
        content: _loc('torgeternity.dialogWindow.realityCheck.content'),
      });

      if (!confirmed) {

        foundry.applications.handlebars.renderTemplate(
          './systems/torgeternity/templates/chat/skill-error-card.hbs',
          {
            message: _loc('torgeternity.chatText.check.cantUseRealityWhileDisconnected'),
            actor: this.uuid,
            actorPic: this.img,
            actorName: this.name,
          }
        ).then(content =>
          ChatMessage.implementation.create({
            speaker: ChatMessage.implementation.getSpeaker({ actor: this }),
            content: content
          })
        )
        // Don't wait for chat message to finish posting
        return;
      }
    }

    return TestDialog.wait({
      testType: testType,
      actor: this,
      itemId: item?.id,
      customSkill: !this.system.skills[skillName],
      isFav: skillData.isFav,
      skillName: skillName,
      skillValue: skillData.value,
    }, { useTargets: (testType === 'skill'), ...options });
  }

  /**
   * Roll an Unarmed Attack
   * @param {String} skillName The internal name of the skill being used for the unarmed attack
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollUnarmedAttack(skillName, options = {}) {
    let dnDescriptor = 'standard';
    if (game.user.targets.size) {
      const firstTarget = game.user.targets.find(token => token.actor.type !== 'vehicle')?.actor ||
        game.user.targets.first().actor;

      if (firstTarget.type === 'vehicle')
        dnDescriptor = 'targetVehicleDefense';
      else
        dnDescriptor = firstTarget.equippedMelee ? 'targetMeleeWeapons' : 'targetUnarmedCombat';
    }

    // Almost the same as rollAttack
    return TestDialog.wait({
      testType: 'attack',
      DNDescriptor: dnDescriptor,
      actor: this,
      amountBD: 0,
      isAttack: true,
      isFav: this.system.skills[skillName]?.isFav,
      skillName: skillName,
      skillValue: this.system.skills[skillName]?.value ?? this.system.attributes.dexterity.value,
      unskilledUse: true,
      damage: this.system.unarmedDamage,
      weaponAP: 0,
      applyArmor: true,
      applySize: true,
      attackOptions: true,
      //chatNote: '',
      bdDamageSum: 0,
      // itemId - no item
    }, { useTargets: true, ...options });
  }

  /**
   * Roll an interaction attack.
   * @param {String} skillName The name of the skill being used for the interaction attack
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollInteractionAttack(skillName, options = {}) {
    const skillData = this.system.skills[skillName];

    let dnDescriptor = 'standard';
    if (game.user.targets.size) {
      switch (skillName) {
        case 'intimidation':
          dnDescriptor = 'targetIntimidation';
          break;
        case 'maneuver':
          dnDescriptor = 'targetManeuver';
          break;
        case 'taunt':
          dnDescriptor = 'targetTaunt';
          break;
        case 'trick':
          dnDescriptor = 'targetTrick';
          break;
        default:
          dnDescriptor = 'standard';
      }
    } else {
      dnDescriptor = 'standard';
    }

    return TestDialog.wait({
      testType: 'interactionAttack',
      DNDescriptor: dnDescriptor,
      actor: this,
      skillName: skillName,
      skillValue: Number(skillData.value),
      isFav: this.system.skills[skillName].isFav,
      unskilledUse: true,
    }, { useTargets: true, ...options });
  }

  /**
   * Roll a Tapping attempt for an Eternity Shard
   * @param {TorgeternityItem} item The item being tested
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollTapping(item, options = {}) {
    const dn = item.system?.tappingDifficulty;
    if (!dn) return ui.notifications.info(`Item does not have a Tapping Difficulty`);

    const skillName = 'reality';
    const skillData = this.system?.skills[skillName];
    if (!skillData) return ui.notifications.info(`Actor does not have the skill ${skillName}`);
    //const attributeName = skillData.baseAttribute;
    const skillValue = Number(skillData.value);

    // Can't use reality while disconnected
    if (this.isDisconnected) {
      return foundry.applications.handlebars.renderTemplate(
        './systems/torgeternity/templates/chat/skill-error-card.hbs',
        {
          message: _loc('torgeternity.chatText.check.cantUseRealityWhileDisconnected'),
          actor: this.uuid,
          actorPic: this.img,
          actorName: this.name,
        }
      ).then(content =>
        ChatMessage.implementation.create({
          speaker: ChatMessage.implementation.getSpeaker({ actor: this }),
          content: content
        })
      )
    }

    return TestDialog.wait({
      testType: 'skill',
      DNDescriptor: 'fixedNumber',
      DNfixed: dn,
      actor: this,
      isFav:
        this.system.skills[skillName]?.isFav ||
        this.system.attributes[skillName]?.isFav ||
        false,
      skillName: skillName,
      skillValue: skillValue,
      chatTitle: _loc('torgeternity.chatText.tapping'),
    }, options);
  }

  /**
   * Roll a soak test
   * @param {*} origMessageId The original chat message for which the soak is being applied.
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async soakDamage(origMessageId, options = {}) {
    const skillName = 'reality';
    const skillValue = this.system.skills[skillName].value;

    // Before calculating roll, check to see if it can be attempted unskilled; exit test if actor doesn't have required skill.
    // Stormknights must always have at least 1 rank in Reality.
    // Threats are managed by the GM, so the GM can decide if the Threat is allowed to spend a Possibility even when it doesn't have any adds.
    //if (this.preventUnskilled(skillValue, skillName)) return;

    return TestDialog.wait({
      testType: 'soak',
      actor: this,
      //actorType: soaker.system.type,
      isFav:
        this.system.skills[skillName]?.isFav ||
        this.system.attributes[skillName]?.isFav ||
        false,
      skillName: skillName,
      skillValue: skillValue,
      soakingMessage: origMessageId,
    }, { useTargets: false, ...options });
    // do reality roll
  }

  // VEHICLE SPECIFIC ROLLS

  /**
   * Roll a Vehicle Chase test
   * @param {Number} skillValue The value of the skill being used for the test
   * @param {Number} vehicleSpeed The speed of the vehicle involved in the test
   * @param {Number} maneuverModifier The modifiers of the vehicle involved in the test
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollVehicleChase(skillValue, vehicleSpeed, maneuverModifier, options = {}) {
    return TestDialog.wait({
      testType: 'chase',
      DNDescriptor: 'highestSpeed',
      actor: this,
      skillName: 'Vehicle Chase',
      skillValue,
      vehicleSpeed,
      maneuverModifier,
    }, { useTargets: true, ...options });
  }

  /**
   * Roll a Vehicle Operation test
   * @param {Number} skillValue The value of the skill being used for the test
   * @param {Number} vehicleSpeed The speed of the vehicle involved in the test
   * @param {Number} maneuverModifier The modifiers of the vehicle involved in the test
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollVehicleOperation(skillValue, vehicleSpeed, maneuverModifier, options = {}) {
    return TestDialog.wait({
      testType: 'vehicleBase',
      actor: this,
      skillName: 'Vehicle Operation',
      skillValue,
      vehicleSpeed,
      maneuverModifier,
    }, { useTargets: true, ...options });
  }

  /**
   * Roll a Vehicle Stunt test
   * @param {Number} skillValue The value of the skill being used for the test
   * @param {Number} vehicleSpeed The speed of the vehicle involved in the test
   * @param {Number} maneuverModifier The modifiers of the vehicle involved in the test
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollVehicleStunt(dnDescriptor, skillValue, vehicleSpeed, maneuverModifier, options = {}) {
    return TestDialog.wait({
      testType: 'stunt',
      DNDescriptor: dnDescriptor,
      actor: this,
      skillName: 'Vehicle Stunt',
      skillValue,
      vehicleSpeed,
      maneuverModifier,
    }, { useTargets: true, ...options });
  }

  /**
   * Roll for an Active Defense
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async rollActiveDefense(options = {}) {
    return TestDialog.wait({
      testType: 'activeDefense',
      DNDescriptor: 'standard',
      actor: this,
      activelyDefending: false,
      isActiveDefenseRoll: true,
      skillName: 'activeDefense',
      skillValue: null,
      unskilledUse: true,
    }, { useTargets: false, ...options });
  }

  /**
   * Roll for a Defeat test
   * @param {String} attribute The internal name of the attribute being used for the test
   * @param {Object} options Extra options for TestDialog
   * @returns 
   */
  async testDefeat(attribute, options = {}) {
    return TestDialog.wait({
      testType: 'attribute',
      DNDescriptor: 'standard',
      actor: this,
      skillName: attribute,
      skillValue: this.system.attributes[attribute].value,
      isDefeatTest: true,
    }, options);
  }

  /**
   * Roll a concentration check
   * @param {Object} speaker The chat message speaker making the roll
   * @param {Object} testdata The test that is involved in the concentration check
   * @param {Object} options Extra options for TestDialog
   */
  async testConcentration(speaker, testdata, options = {}) {
    // Convert strings to the correct type(s)
    const test = {
      // could be attribute (Spirit) or skill (Willpower) check
      DNDescriptor: 'standard',
      actor: this,
      ...testdata,
    };
    test.isFav = !!test.isFav;
    test.unskilledUse = !!test.unSkilledUse;
    test.skillAdds = Number(test.skillAdds);
    test.skillValue = Number(test.skillValue);
    test.isConcentrationCheck = true;

    // Failure will prompt the user to trigger `this.cancelConcentration`
    return TestDialog.wait(test, options);
  }

  async cancelConcentration() {
    const failed = this.effects.filter(ef => ef.statuses.has('concentrating'));
    const list = failed.map(ef => `<li>${fromUuidSync(ef.origin).name}</li>`);

    ChatMessage.implementation.create({
      speaker: ChatMessage.implementation.getSpeaker({ actor: this }),
      content: `<p>${_loc('torgeternity.chatText.concentration.broken', { actor: this.name })}</p><ul>${list.join('')}</ul>`
    })
    this.deleteEmbeddedDocuments('ActiveEffect', failed.map(ef => ef.id));
  }

  /**
   * Checks to see if the given skill is actually unskilled for the indicated actor.
   * If unskilled, a message is sent to the chat log.
   * @param {String} skillValue The value of the skill being checked
   * @param {Number} skillName The name of the skill being checked
   * @returns {Boolean} Returns true if the actor is UNSKILLED at 'skillName'
   */
  preventUnskilled(skillValue, skillName) {
    if (skillValue) return false;

    foundry.applications.handlebars.renderTemplate(
      './systems/torgeternity/templates/chat/skill-error-card.hbs',
      {
        message: _loc('torgeternity.skills.' + skillName) + ' ' + _loc('torgeternity.chatText.check.cantUseUntrained'),
        actor: this.uuid,
        actorPic: this.img,
        actorName: this.name,
      }).then(content =>
        ChatMessage.implementation.create({
          speaker: ChatMessage.implementation.getSpeaker({ actor: this }),
          content: content
        })
      )

    return true;
  }

}

/**
 * during MIGRATION of old format Vehicles, convert an old `operator.name` StringField into a new `operator` ForeignDocumentField
 */
Hooks.on('setup', () => {
  const updates = deferredDrivers;
  deferredDrivers = null;
  for (const update of updates) {
    const driver = game.actors.find(actor => actor.name === update.driverName);
    const vehicle = game.actors.get(update.vehicleId);
    if (!vehicle)
      console.warn(`VEHICLE OPERATOR: Failed to find vehicle with ID '${update.vehicleId}'`);
    else if (!driver)
      console.warn(`VEHICLE OPERATOR: Failed to find driver with name '${update.name}' for vehicle ${vehicle.name}'`);
    else
      vehicle.update({ 'system.operator': driver.id })
  }
})