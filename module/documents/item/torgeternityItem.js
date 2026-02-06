import { torgeternity } from '../../config.js';

let deferredGunners = new Set();

const torg_icons = 'systems/torgeternity/images/icons/';
const chat_templates = 'systems/torgeternity/templates/chat/';
/**
 *
 */
export default class TorgeternityItem extends foundry.documents.Item {
  // TODO: Chatcardtemplate for ammunitions & race
  static CHAT_TEMPLATE = {
    // ammunition?
    attack: `${chat_templates}attack-card.hbs`, // not an Item type
    bonus: `${chat_templates}bonus-card.hbs`, // not an Item type
    armor: `${chat_templates}armor-card.hbs`,
    currency: `${chat_templates}currency-card.hbs`,
    //customAttack: `${chat_templates}customAttack-card.hbs`,
    customSkill: `${chat_templates}customSkill-card.hbs`,
    enhancement: `${chat_templates}enhancement-card.hbs`,
    eternityshard: `${chat_templates}eternityshard-card.hbs`,
    //firearm: `${chat_templates}firearm-card.hbs`,
    gear: `${chat_templates}gear-card.hbs`,
    //heavyweapon: `${chat_templates}heavyweapon-card.hbs`,
    implant: `${chat_templates}implant-card.hbs`,
    meleeweapon: `${chat_templates}meleeweapon-card.hbs`,
    miracle: `${chat_templates}miracle-card.hbs`,
    //missileweapon?
    perk: `${chat_templates}perk-card.hbs`,
    psionicpower: `${chat_templates}psionicpower-card.hbs`,
    // race?
    shield: `${chat_templates}shield-card.hbs`,
    specialability: `${chat_templates}specialability-card.hbs`,
    //specialability-rollable?
    spell: `${chat_templates}spell-card.hbs`,
    vehicle: `${chat_templates}vehicle-card.hbs`,
    vehicleAddOn: `${chat_templates}vehicleAddOn-card.hbs`,
  };

  /**
   *
   */
  prepareBaseData() {
    // Handle perk-related data
    switch (this.type) {
      case 'perk':
        this.system.navStyle = 'right:-210px;top:210px';
        this.system.extendedNav = true;
        break;
      default:
        this.system.navStyle = 'right:-110px;top:115px';
        this.system.extendedNav = false;
    }

    for (const [key, value] of Object.entries(torgeternity.dnTypes)) {
      if (key === this.system?.dn) {
        this.system.dnType = game.i18n.localize(value);
        break;
      }
    }
  }

  static DEFAULT_ICONS = {
    ammunition: `${torg_icons}ammo-icon.webp`,
    gear: `${torg_icons}gear-icon.webp`,
    currency: 'icons/commodities/currency/coins-assorted-mix-silver.webp',
    eternityshard: `${torg_icons}eternityshard.webp`,
    armor: `${torg_icons}armor-icon.webp`,
    shield: `${torg_icons}shield.webp`,
    meleeweapon: `${torg_icons}axe-icon.webp`,
    missileweapon: `${torg_icons}missile-weapon-icon.webp`,
    firearm: `${torg_icons}firearm-icon.webp`,
    implant: `${torg_icons}cyberware-icon.webp`,
    heavyweapon: `${torg_icons}explosion-icon.webp`,
    vehicle: `${torg_icons}vehicle-icon.webp`,
    vehicleAddOn: `${torg_icons}vehicle-addon-icon.webp`,
    perk: `${torg_icons}reality-icon.webp`,
    enhancement: `${torg_icons}enhancement.webp`,
    specialability: `${torg_icons}torgeternity-icon.webp`,
    'specialability-rollable': `${torg_icons}bite-icon.webp`,
    spell: `${torg_icons}spell-icon.webp`,
    miracle: `${torg_icons}miracles-icon.webp`,
    psionicpower: `${torg_icons}psionicpower.webp`,
    race: `${torg_icons}race-icon.webp`,
    customSkill: `${torg_icons}custom-skills.webp`,
    customAttack: `${torg_icons}melee-weapon-icon.webp`,
  };

  static migrateData(source) {
    // For better support, convert the old damaging abilities into custom attacks with a flat damage modifier.

    // See the "Migrate CustomAttacks" macro which should be used after uncommenting the following lines
    // and reloading Foundry.
    //if (source.type === 'specialability-rollable' && source.system?.damage && source.system.attackWith) {
    //  source.type = 'customAttack';
    //  source.system.damageType ??= 'flat'
    //}
    if (typeof source.system?.gunner?.name === 'string') {
      if (source.system.gunner.name)
        deferredGunners.add({ weaponId: source._id, gunnerName: source.system.gunner.name })
      if (source.system.gunner.skillValue)
        source.system.gunnerFixedSkill = parseInt(source.system.gunner.skillValue);
      delete source.system.gunner;
    }
    return super.migrateData(source);
  }

  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    if (this.img === 'icons/svg/item-bag.svg') {
      const image = TorgeternityItem.DEFAULT_ICONS[data.type] ?? null;
      if (image) {
        await this.updateSource({ img: image });
      }
    }

    if (
      this.actor &&
      this?.actor?.system.details.race !== game.i18n.localize('torgeternity.sheetLabels.noRace') &&
      data.type === 'race'
    ) {
      ui.notifications.error(game.i18n.localize('torgeternity.notifications.raceExistent'));
      return false;
    }

    if (this.type === 'perk' || this.type === 'customAttack')
      this.updateSource({ 'system.transferenceID': this.id }); // necessary for saving perks or custom attack data in race items
    else if (this.type === 'miracle')
      this.updateSource({ 'system.skill': 'faith' });
  }

  /**
   * When a new armor or shield is equipped, unequip any previously equipped item of the same type.
   * @param data
   * @param options
   * @param userId
   */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    if (game.user.id !== userId) return;

    if (this.parent && ['armor', 'shield'].includes(this.type) && this.system.equipped) {
      const actor = this.parent;
      const previousEquipped = actor.items.find(
        item => item.id !== this.id && item.system.equipped && item.type === this.type
      );

      if (previousEquipped) {
        TorgeternityItem.toggleEquipState(previousEquipped, actor);
      }
    }
  }

  /**
   * See API https://foundryvtt.com/api/classes/foundry.abstract.Document.html#_preUpdate
   *
   * @param {any} changes
   * @param {any} options
   * @param {object} user Default: Base user
   * @returns
   */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    if (
      foundry.utils.getProperty(changes, 'system.ammo') &&
      changes.system.ammo.value > this.system.ammo.max
    ) {
      changes.system.ammo.value = await Math.clamp(
        changes.system.ammo.value ?? this.system.ammo.value,
        0,
        changes.system.ammo.max ?? this.system.ammo.max
      );

      ui.notifications.warn(
        game.i18n.format('torgeternity.notifications.ammoValueExceedsMax', { a: this.name })
      );
    }

    if (this.type === 'implant' &&
      changes?.system?.implantType &&
      (!changes.img || this.img === changes.img) &&
      this.img.startsWith(torg_icons)) {

      changes.img = `${torg_icons}${changes.system.implantType}-icon.webp`;
    }
  }

  /**
   *
   * @param {Item} item the item that gets equipped or unequipped
   * @param {Actor} actor the actor that the item belongs to
   */
  static toggleEquipState(item, actor) {
    const wasEquipped = item.system.equipped;
    const itemUpdates = [
      {
        _id: item.id,
        'system.equipped': !wasEquipped,
      },
    ];
    // enable/disable effects
    const sourceOrigin = 'Item.' + item._id;
    const effectUpdates = actor.effects
      .filter((e) => e.origin && e.origin.endsWith(sourceOrigin))
      .map((e) => ({ _id: e.id, disabled: wasEquipped }));

    // for armors and shields, ensure that there is only one equipped at a time
    if (!wasEquipped && ['armor', 'shield'].includes(item.type)) {
      actor.items
        .filter(it => it.id !== item.id && it.system.equipped && it.type === item.type)
        .forEach(it => {
          itemUpdates.push({
            _id: it.id,
            'system.equipped': false,
          });
          effectUpdates.push(
            ...actor.effects
              .filter((e) => e.origin && e.origin.endsWith('Item.' + it._id))
              .map((e) => ({ _id: e.id, disabled: true }))
          );
        });
    }
    actor.updateEmbeddedDocuments('Item', itemUpdates);
    actor.updateEmbeddedDocuments('ActiveEffect', effectUpdates);
  }

  async #encodeString(options) {
    const template = TorgeternityItem.CHAT_TEMPLATE[this.type];
    if (!template) return undefined;
    const renderedTemplate = await foundry.applications.handlebars.renderTemplate(template, this);
    return foundry.applications.ux.TextEditor.enrichHTML(renderedTemplate, { secrets: this.isOwner });
  }
  /**
   *
   */
  async toMessage() {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: await this.#encodeString({ secrets: this.isOwner }),
    });
  }

  async _buildEmbedHTML(config, options) {
    console.log('Item._buildEmbedHTML', { item: this, config, options });
    const enriched = await this.#encodeString(options);
    if (!enriched) return undefined;
    const container = document.createElement("div");
    container.innerHTML = enriched;
    return container.children;
  }

  /**
   * Getter for a weapon that might have finite ammo or not (meelee weapons don't have ammo)
   *  @returns true/false
   */
  get weaponWithAmmo() {
    if (!this.system?.ammo?.max) return false;
    return !game.settings.get('torgeternity', 'ignoreAmmo');
  }

  /**
   * Does the weapon have ammo?
   *
   * @returns {boolean} Does the weapon have ammo? True/False
   */
  get hasAmmo() {
    return this.system?.ammo.value > 0;
  }

  get isBlastAmmo() {
    return this.system.traits.find(trait => trait.endsWith('Blast'));
  }

  /**
   * Does the weapon have sufficient ammo? Will only be important for burst attacks.
   *
   * @param {number} burstModifier The Burstmodifier whereas the amount of bullets are calculated from
   * @param {number} targets The amount of targets
   * @returns {boolean} True/False if the check is ok
   */
  hasSufficientAmmo(burstModifier, targets = 1) {
    const currentAmmo = this.system.ammo.value;
    const bulletAmount = this.#estimateBulletLoss(burstModifier);

    if (this.isBlastAmmo) targets = 1;
    return currentAmmo >= bulletAmount * targets;
  }

  /**
   * Reduces the ammo of a weapon
   *
   * @param {number} burstModifier the burst mode to estimate the bullets
   * @param {number} targets The quantity of targets
   */
  async reduceAmmo(burstModifier, targets = 1) {
    const currentAmmo = this.system.ammo.value;
    // Blast weapons only use 1 ammo regardless of the number of targets
    if (this.isBlastAmmo) targets = 1;

    await this.update({
      'system.ammo.value': currentAmmo - this.#estimateBulletLoss(burstModifier) * targets,
    });
  }

  /**
   * Estimates the number of used bullets.
   *
   * @param {number} burstModifier The modifier of the burst (on no burst, this will be 0 per Standard)
   * @returns {number} The amount of bullets that are used
   */
  #estimateBulletLoss(burstModifier) {
    switch (burstModifier) {
      case 2: return 3;
      case 4: return 7;
      case 6: return 50;
      case 0:
      default:
        return 1;
    }
  }

  /**
   * Return true if this item is a Perk that will always cause a contradiction when used outside its realm.
   * @param {TorgeternityScene} scene 
   * @returns {Boolean} 
   */
  isGeneralContradiction(scene) {
    return this.type === 'perk' &&
      this.system.cosm !== 'none' &&
      !scene.hasCosm(this.system.cosm);
  }

  /**
   * Indicates if this item will cause a contradiction in either of the supplied cosms,
   * or if it exceeds the provided axiom limits
   * @param {Object} maxAxioms (see CONFIG.torgeternity.axiomByCosm)
   * @returns Boolean
   */
  isContradiction(maxAxioms) {
    if (!maxAxioms) return false;

    const results = [];

    for (const field of Object.keys(maxAxioms))
      if (this.system.axioms[field] > maxAxioms[field])
        results.push({ axiom: field, item: this.system.axioms[field], max: maxAxioms[field] });

    return results.length ? results : null;
  }

  /**
   * Returns true if the item exceeds the current scene's axioms whilst on a disconnected actor,
   * or is a Starred Perk when the Item is not inside the correct cosm.
  */
  get isDisconnected() {
    // If not embedded, then it isn't disconnected
    if (!this.parent?.isDisconnected) return false;

    const scene = game.scenes.active;
    if (!scene || scene.torg.cosm === 'none') return false;

    // Some Perks just don't work outside their own COSM while disconnected
    if (this.isGeneralContradiction(scene)) return true;

    return this.isContradiction(scene.torg.axioms);
  }
}

/**
 * during MIGRATION of old format Vehicles, convert an old `gunner.name` StringField into a new `gunner` ForeignDocumentField
 */
Hooks.on('setup', async () => {
  const updates = deferredGunners;
  deferredGunners = null;
  for (const update of updates) {
    const gunner = game.actors.find(actor => actor.name === update.gunnerName);
    const vehicle = game.actors.find(actor => actor.type === 'vehicle' && actor.items.get(update.weaponId));
    const weapon = vehicle?.items.get(update.weaponId);
    if (gunner && weapon)
      await weapon.update({ 'system.gunner': gunner.id })
    else if (!gunner)
      console.warn(`GUNNER MIGRATION: Failed to find gunner called '${update.name}'`);
    else // weapon WILL be valid if vehicle is valid
      console.warn(`GUNNER MIGRATION: Failed to find vehicle with weapon Id '${update.weaponId}'`);
  }
})