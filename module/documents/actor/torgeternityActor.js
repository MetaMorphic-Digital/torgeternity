/**
 *
 */
let deferredDrivers = new Set();

export default class TorgeternityActor extends foundry.documents.Actor {
  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * simple getter for the equipped armor item
   *
   * @returns {Item|null}
   */
  get equippedMelee() {
    return this.itemTypes.meleeweapon.find((a) => a.system.equipped) ?? null;
  }

  get equippedMelees() {
    return this.itemTypes.meleeweapon.filter((a) => a.system.equipped) ?? null;
  }

  get race() {
    return this.itemTypes.race[0] ?? null;
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * @inheritdoc
   */
  prepareBaseData() {
    if (game.release.generation >= 14) super.prepareBaseData();  // Foundry 14+

    // Here Effects are not yet applied
    if (this.type !== 'vehicle') {
      // initialize the worn armor and shield bonus
      const wornArmor = this.itemTypes.armor.find((a) => a.system.equipped);
      const heldShield = this.itemTypes.shield.find((a) => a.system.equipped);
      const shieldBonus = heldShield?.system?.bonus ?? 0;

      this.fatigue = 2 + (wornArmor?.system?.fatigue ?? 0);
      this.system.other.maxDex = wornArmor?.system?.maxDex ?? 0;
      const highestMinStrWeapons = Math.max(...this.equippedMelees?.map((m) => m.system.minStrength)) ?? 0;
      this.system.other.minStr = Math.max(
        wornArmor?.system?.minStrength ?? 0,
        heldShield?.system?.minStrength ?? 0,
        highestMinStrWeapons);
      // TODO: If we allow more than 1 wornArmor and an array is to be expected, then we need to change that here.
      // 'value' of each field is set in prepareDerivedData
      this.defenses = {
        dodge: { value: 0, mod: shieldBonus },
        meleeWeapons: { value: 0, mod: shieldBonus },
        unarmedCombat: { value: 0, mod: 0 },
        intimidation: { value: 0, mod: 0 },
        maneuver: { value: 0, mod: 0 },
        taunt: { value: 0, mod: 0 },
        trick: { value: 0, mod: 0 },
        toughness: this.system.attributes.strength.value,
        armor: wornArmor?.system?.bonus ?? 0,
        shield: shieldBonus
      };
      this.unarmed = { damage: 0, damageMod: 0 };

      if (this.type === 'stormknight') {
        if (this.race) {
          for (const attribute of Object.keys(this.race.system.attributeMaximum)) {
            this.system.attributes[attribute].maximum = this.race.system.attributeMaximum[attribute];
          }
          this.system.details.race = this.race.name;
        } else {
          this.system.details.race = game.i18n.localize('torgeternity.sheetLabels.noRace');
        }
      }

    } else {
      // vehicle
      this.defenses = {
        toughness: this.system.toughness,
        armor: this.system.armor,
      };
    }

    this.statusModifiers = {
      stymied: 0,
      vulnerable: 0,
      darkness: 0,
      waiting: 0,
      concentrating: 0,
    };

    this.targetModifiers = {
      darkness: 0,
    };

    this.defenses.damageTraits = {
      // Armor: addition armor of the defender when damage is of the indicated type
      energyArmor: 0,
      fireArmor: 0,
      forceArmor: 0,
      iceArmor: 0,
      lightningArmor: 0,
      // Defense: increases the Defense skill of the defender when damage is of the indicated type
      energyDefense: 0,
      fireDefense: 0,
      forceDefense: 0,
      iceDefense: 0,
      lightningDefense: 0
    }
  }


  /**
   * @inheritdoc
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    // Here Effects are applied, whatever follow cannot be directly affected by Effects

    // apply status effects (note that base values of 0 might have been modified by Active Effects)
    this.statusModifiers.stymied += this.statuses.has('veryStymied') ? -4 : this.statuses.has('stymied') ? -2 : 0;
    this.statusModifiers.vulnerable += this.statuses.has('veryVulnerable') ? 4 : this.statuses.has('vulnerable') ? 2 : 0;
    this.statusModifiers.darkness += this.statuses.has('pitchBlack') ? -6 : this.statuses.has('dark') ? -4 : this.statuses.has('dim') ? -2 : 0;
    this.statusModifiers.waiting += this.statuses.has('waiting') ? -2 : 0;
    this.statusModifiers.concentrating += this.appliedEffects.filter(ef => ef.statuses.has('concentrating')).length * -2;

    // Place limits on the modifiers (can't cross the 0 boundary)
    if (this.statusModifiers.stymied > 0) this.statusModifiers.stymied = 0;
    if (this.statusModifiers.darkness > 0) this.statusModifiers.darkness = 0;
    if (this.statusModifiers.waiting > 0) this.statusModifiers.waiting = 0;
    if (this.statusModifiers.concentrating > 0) this.statusModifiers.concentrating = 0;
    if (this.statusModifiers.vulnerable < 0) this.statusModifiers.vulnerable = 0;

    // Skillsets
    if (this.type !== 'vehicle') {
      const skills = this.system.skills;
      const attributes = this.system.attributes;
      // by RAW, FIRST you checkout for maxDex, THEN minStr. Doing this into DerivedData means, it takes place after AE's were applied, making sure, this cannot get higher than armor's limitations.
      // only apply if a maxDex value is set
      attributes.dexterity.value =
        this.system.other.maxDex > 0
          ? Math.min(attributes.dexterity.value, this.system.other.maxDex)
          : attributes.dexterity.value;
      attributes.dexterity.value += Math.min(
        0,
        attributes.strength.value - this.system.other.minStr
      );

      // Calculate Move and Run base values
      // Derive Skill values for Storm Knights and Threats
      for (const [name, skill] of Object.entries(skills)) {
        const trained = skill.unskilledUse || this._source.system.skills[name].adds;
        skill.value = trained ? this.system.attributes[skill.baseAttribute].value + skill.adds : '';
      }

      // Set base unarmed damage

      this.unarmed.damage = attributes.strength.value + this.unarmed.damageMod;

      // claculate final toughness
      this.defenses.toughness += this.defenses.armor;

      // Set Defensive Values based on modified skills and attributes

      const dodgeDefenseSkill = skills.dodge.value || attributes.dexterity.value;
      this.defenses.dodge.value = dodgeDefenseSkill + this.defenses.dodge.mod;

      const meleeWeaponsDefenseSkill = skills.meleeWeapons.value || attributes.dexterity.value;
      this.defenses.meleeWeapons.value = meleeWeaponsDefenseSkill + this.defenses.meleeWeapons.mod;
      // (Core pg 126) Wielding two melee weapons increases melee weapons defense by 2.
      if (this.type !== 'vehicle') {
        const meleeWeaponCount = this.items.filter(item => item.type === 'meleeweapon' && item.system.equipped);
        if (meleeWeaponCount.length > 1) this.defenses.meleeWeapons.value += 2;
      }

      const unarmedCombatDefenseSkill = skills.unarmedCombat.value || attributes.dexterity.value;
      this.defenses.unarmedCombat.value = unarmedCombatDefenseSkill + this.defenses.unarmedCombat.mod;

      const intimidationDefenseSkill = skills.intimidation.value || attributes.spirit.value;
      this.defenses.intimidation.value = intimidationDefenseSkill + this.defenses.intimidation.mod;

      const maneuverDefenseSkill = skills.maneuver.value || attributes.dexterity.value;
      this.defenses.maneuver.value = maneuverDefenseSkill + this.defenses.maneuver.mod;

      const tauntDefenseSkill = skills.taunt.value || attributes.charisma.value;
      this.defenses.taunt.value = tauntDefenseSkill + this.defenses.taunt.mod;

      const trickDefenseSkill = skills.trick.value || attributes.mind.value;
      this.defenses.trick.value = trickDefenseSkill + this.defenses.trick.mod;

      // Apply the moveMod effect for SKs & threats
      this.system.other.move = this.system.attributes.dexterity.value;
      this.system.other.run = this.system.attributes.dexterity.value * 3;

      const listChanges = [];
      let computeMove = this.system.other.move;
      this.appliedEffects.forEach((ef) =>
        ef.changes.forEach((k) => { if (k.key === 'system.other.moveMod') listChanges.push(k); })
      );
      // Modify +/-
      listChanges
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.ADD)
        .forEach((ef) => { computeMove += parseInt(ef.value); });
      // Modify x
      listChanges
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.MULTIPLY)
        .forEach((ef) => { computeMove = parseInt(computeMove * ef.value); });
      // Modify minimum
      listChanges
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE)
        .forEach((ef) => { computeMove = Math.max(computeMove, parseInt(ef.value)); });
      // Modify maximum
      listChanges
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.DOWNGRADE)
        .forEach((ef) => { computeMove = Math.min(computeMove, parseInt(ef.value)); });
      // Modify Fixed
      listChanges
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE)
        .forEach((ef) => { computeMove = parseInt(ef.value); });
      this.system.other.move = computeMove;
      //
      // Apply the runMod effect
      const listRun = [];
      let computeRun = this.system.other.run;
      this.appliedEffects.forEach((ef) =>
        ef.changes.forEach((k) => { if (k.key === 'system.other.runMod') listRun.push(k); })
      );
      // Modify +/-
      listRun
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.ADD)
        .forEach((ef) => { computeRun += parseInt(ef.value); });
      // Modify x
      listRun
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.MULTIPLY)
        .forEach((ef) => { computeRun = parseInt(computeRun * ef.value); });
      // Modify minimum
      listRun
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE)
        .forEach((ef) => { computeRun = Math.max(computeRun, parseInt(ef.value)); });
      // Modify maximum
      listRun
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.DOWNGRADE)
        .forEach((ef) => { computeRun = Math.min(computeRun, parseInt(ef.value)); });
      // Modify Fixed
      listRun
        .filter((ef) => ef.mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE)
        .forEach((ef) => { computeRun = parseInt(ef.value); });
      this.system.other.run = computeRun;
    }
  }

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
    if (attribute !== 'shock' && attribute !== 'wounds') {
      return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
    }

    // Mostly the same as core Foundry
    const attr = foundry.utils.getProperty(this.system, attribute);
    const current = isBar ? attr.value : attr;
    const update = isDelta ? current + value : value;
    if (update === current) return this;
    let updates = { [`system.${attribute}.value`]: update };   // NO Math.clamp
    const allowed = Hooks.call("modifyTokenAttribute", { attribute, value, isDelta, isBar }, updates, this);
    return allowed !== false ? this.update(updates) : this;
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
          this.token.update({ texture: { src: changed.img } });
        else
          this.updateSource({ prototypeToken: { texture: { src: changed.img } } })
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
              game.i18n.localize('torgeternity.notifications.reachedMaximumAttr')
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
      let hand = this.getDefaultHand();
      // If there is no hand for that SK, and a GM is online, create one
      if (!hand && game.user.isActiveGM) {
        hand = this.createDefaultHand();
      }
      // If the update includes permissions, sync them to the hand
      if (hand && changed['==ownership'] && game.userId === userId) {
        // DO NOT PUT ANYTHING ELSE IN THIS UPDATE! diff:false, recursive:false can easily nuke stuff
        hand.update({ ownership: this.getHandOwnership() }, { diff: false, recursive: false });
      }
    }

    // Skip most of the rest if we didn't make the update
    // although we need to update the player list after all other changes if possibilities have changed.
    if (game.userId === userId) {

      /* Check for exceeding shock and/or wounds */

      if (options.woundsExceeded) {
        if (this.type === 'stormknight')
          this.notifyDefeat();
        else if (game.settings.get('torgeternity', 'autoWound'))
          this.toggleStatusEffect('dead', { active: true, overlay: true });
      }

      if (options.shockExceeded && !this.hasStatusEffect('dead') && game.settings.get('torgeternity', 'autoShock')) {
        this.toggleStatusEffect('unconscious', {
          active: true,
          overlay: true,
          duration: {
            startTime: game.time.worldTime,
            seconds: 30 * 60 // 30 minutes
          }
        });
      }

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
    return await Cards.create({
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

  get isDisconnected() {
    return this.statuses.has('disconnected') ?? false;
  }

  hasStatusEffect(statusId) {
    return this.statuses.has(statusId) ?? false;
  }

  get isConcentrating() {
    return this.statusModifiers.concentrating !== 0;
  }

  /**
   * Apply the supplied amount of shock and/or wound damage to this actor.
   * Supplying a negative number will act as healing.
   * 
   * @param {number} shock The amount of shock to inflict on this actor.
   * @param {number} wounds The number of wounds to inflict on this actor.
   * @returns {Promise<this>}
   */
  applyDamages(shock, wounds) {
    let updates = {};
    let result = {};
    // No clamping of values
    if (shock && this.type !== 'vehicle') {
      const newvalue = this.system.shock.value + shock;
      if (newvalue > this.system.shock.max) result.shockExceeded = true;
      updates['system.shock.value'] = this.system.shock.value + shock;
    }
    if (wounds) {
      const newvalue = this.system.wounds.value + wounds;
      if (newvalue > this.system.wounds.max) result.woundsExceeded = true;
      updates['system.wounds.value'] = this.system.wounds.value + wounds;
    }
    this.update(updates);
    return result;
  }

  async notifyDefeat() {
    const attribute = (this.system.attributes.spirit.value < this.system.attributes.strength.value) ? 'spirit' : 'strength';

    const html = `<p>${game.i18n.format('torgeternity.defeat.prompt', { name: this.name })}
    <div class="skill-roll-menu">
     <a class="button roll-button roll-defeat ${(attribute === 'strength') && 'notPreferred'}"
     data-action="testDefeat" data-control="spirit" }>
     ${game.i18n.localize('torgeternity.attributes.spirit')}
     </a>
     <a class="button roll-button roll-defeat ${(attribute === 'spirit') && 'notPreferred'}" 
     data-action="testDefeat" data-control="strength" >
     ${game.i18n.localize('torgeternity.attributes.strength')}
     </a>
     </div>`;

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
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
        duration: { rounds: duration, turns: duration }
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
    effect.update({ origin, duration: { rounds: duration, turns: duration } })
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
        duration: { rounds: duration, turns: duration }
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
        duration: { rounds: duration, turns: duration }
      })
    }
  }

  /**
   * Sets an Active Defense no an actor with the supplied bonus.
   * @param {Number} bonus 
   */
  async setActiveDefense(bonus) {

    const equippedShield = this.items.find(item => item.type === 'shield' && item.system.equipped); // Search for an equipped shield
    let shieldBonus = (equippedShield && !this.hasStatusEffect('vulnerable') && !this.hasStatusEffect('veryVulnerable')) ? equippedShield.system.bonus : 0

    return this.createEmbeddedDocuments('ActiveEffect', [{
      name: 'ActiveDefense', // Add an icon to remind the defense, bigger ? Change color of Defense ?
      icon: 'icons/equipment/shield/heater-crystal-blue.webp', // To change I think, taken in Core, should have a dedicated file
      duration: { rounds: 1 },
      origin: this.uuid,
      changes: [
        {
          // Modify all existing "basic" defense in block
          key: 'defenses.dodge.mod', // Should need other work for defense vs powers
          value: bonus, // that don't target xxDefense
          priority: 20, // Create a data.ADB that store the bonus ?
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        },
        {
          key: 'defenses.intimidation.mod',
          value: bonus,
          priority: 20,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        },
        {
          key: 'defenses.maneuver.mod',
          value: bonus,
          priority: 20,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        },
        {
          key: 'defenses.meleeWeapons.mod',
          value: bonus,
          priority: 20,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        },
        {
          key: 'defenses.taunt.mod',
          value: bonus,
          priority: 20,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        },
        {
          key: 'defenses.trick.mod',
          value: bonus,
          priority: 20,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        },
        {
          key: 'defenses.unarmedCombat.mod',
          value: bonus,
          priority: 20,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        },
        {
          key: 'defenses.toughness',
          value: shieldBonus,
          priority: 20,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
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
    //console.log(`${this.name}: new darkness state = ${darkness}`)

    for (const status of Object.keys(CONFIG.torgeternity.darknessModifiers)) {
      if (this.statuses.has(status) && status !== darkness) {
        //console.log(`${this.name}: disabling status '${status}'`)
        await this.toggleStatusEffect(status);
      }
    }
    if (darkness && !this.statuses.has(darkness)) {
      //console.log(`${this.name}: enabling status '${darkness}'`)
      await this.toggleStatusEffect(darkness);
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
    for (const effect of this.effects.filter((e) => e.duration.type === 'turns')) {
      if (effect.name === 'ActiveDefense') continue;
      if (effect.duration.turns <= 1 && effect.duration.rounds <= 1)
        toDelete.push(effect.id)
      else
        toUpdate.push({
          _id: effect.id,
          'duration.turns': Math.max(0, effect.duration.turns - 1),
          'duration.rounds': Math.max(0, effect.duration.rounds - 1),
        });
    }
    const promises = [];
    if (toUpdate.length) promises.push(this.updateEmbeddedDocuments('ActiveEffect', toUpdate));
    if (toDelete.length) promises.push(this.deleteEmbeddedDocuments('ActiveEffect', toDelete));
    return Promise.all(promises);
  }

  /**
   * Returns either the AE for the Active Defense currently on the target, or undefined.
   */
  get activeDefense() {
    return this.effects.find(ef => ef.name === 'ActiveDefense')
  }

  async addConcentration(item) {
    const effect = (await ActiveEffect.fromStatusEffect('concentrating')).toObject();
    Object.assign(effect,
      {
        name: game.i18n.format('torgeternity.chatText.concentration.AEname', { item: item.name }),
        origin: item.uuid,
        description: game.i18n.format('torgeternity.chatText.concentration.AEdescription', {
          actor: this.name,
          itemName: item.name,
          itemType: game.i18n.localize(CONFIG.Item.typeLabels[item.type])
        })
      })
    return ActiveEffect.implementation.create(effect, { parent: this });
  }

  /**
   * Return the defensive traits currently applicable for this actor, comprising:
   * - all traits on the equipped armour
   * - all traits on perks
   * (TBD: all traits added by AE on equipped items)
   */
  get defenseTraits() {
    const result = [];
    for (const item of this.items) {
      if ((item.type === 'armor' && item.system.equipped) ||
        item.type === 'perk' ||
        item.type === 'specialability' ||
        item.type === 'specialabilityRollable') {
        result.push(...item.system.traits.filter(trait => Object.hasOwn(CONFIG.torgeternity.defenseTraits, trait)));
      }
    }
    return result;
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