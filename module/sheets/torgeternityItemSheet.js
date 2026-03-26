import { onManageActiveEffect, prepareActiveEffectCategories } from '../effects.js';
const { DialogV2 } = foundry.applications.api;

/**
 *
 */
export default class TorgeternityItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['torgeternity', 'sheet', 'item', 'themed', 'theme-light'],
    window: {
      contentClasses: ['standard-form', 'scrollable'],
      resizable: true,
    },
    form: {
      submitOnChange: true
    },
    actions: {
      effectControl: TorgeternityItemSheet.#onEffectControl,
      convertRsa: TorgeternityItemSheet.#onConvertRsa,
      addEnhancement: TorgeternityItemSheet.#onAddEnhancement,
      removeEnhancement: TorgeternityItemSheet.#onRemoveEnhancement,
      addLimitation: TorgeternityItemSheet.#onAddLimitation,
      removeLimitation: TorgeternityItemSheet.#onRemoveLimitation,
      reloadWeapon: TorgeternityItemSheet.#onReloadWeapon,
      itemName: TorgeternityItemSheet.#onItemName,
      itemDelete: TorgeternityItemSheet.#onItemDelete,
      toggleTraitEdit: TorgeternityItemSheet.#onToggleTraitEdit,
      resetPoss: TorgeternityItemSheet.#onResetPoss,
      showImage: TorgeternityItemSheet.#onShowImage,
    },
  }

  static PARTS = {
    header: { template: 'systems/torgeternity/templates/items/item-header.hbs' },
    tabs: { template: 'templates/generic/tab-navigation.hbs' },
    effects: { template: 'systems/torgeternity/templates/parts/active-effects.hbs', scrollable: [".scrollable"] },

    // same order as in system.json
    ammunition: { template: `systems/torgeternity/templates/items/ammunition-sheet.hbs`, scrollable: [".scrollable"] },
    armor: { template: `systems/torgeternity/templates/items/armor-sheet.hbs`, scrollable: [".scrollable"] },
    currency: { template: `systems/torgeternity/templates/items/currency-sheet.hbs`, scrollable: [".scrollable"] },
    customAttack: { template: `systems/torgeternity/templates/items/customAttack-sheet.hbs`, scrollable: [".scrollable"] },
    customSkill: { template: `systems/torgeternity/templates/items/customSkill-sheet.hbs`, scrollable: [".scrollable"] },
    enhancement: { template: `systems/torgeternity/templates/items/enhancement-sheet.hbs`, scrollable: [".scrollable"] },
    eternityshard: { template: `systems/torgeternity/templates/items/eternityshard-sheet.hbs`, scrollable: [".scrollable"] },
    firearm: { template: `systems/torgeternity/templates/items/firearm-sheet.hbs`, scrollable: [".scrollable"] },
    gear: { template: `systems/torgeternity/templates/items/gear-sheet.hbs`, scrollable: [".scrollable"] },
    heavyweapon: { template: `systems/torgeternity/templates/items/heavyweapon-sheet.hbs`, scrollable: [".scrollable"] },
    implant: { template: `systems/torgeternity/templates/items/implant-sheet.hbs`, scrollable: [".scrollable"] },
    meleeweapon: { template: `systems/torgeternity/templates/items/meleeweapon-sheet.hbs`, scrollable: [".scrollable"] },
    miracle: { template: `systems/torgeternity/templates/items/powers-sheet.hbs`, scrollable: [".scrollable"] },
    missileweapon: { template: `systems/torgeternity/templates/items/missileweapon-sheet.hbs`, scrollable: [".scrollable"] },
    perk: { template: `systems/torgeternity/templates/items/perk-sheet.hbs`, scrollable: [".scrollable"] },
    perkEnhancements: { template: `systems/torgeternity/templates/items/perk-enhancements-sheet.hbs`, scrollable: [".scrollable"] },
    perkLimitations: { template: `systems/torgeternity/templates/items/perk-limitations-sheet.hbs`, scrollable: [".scrollable"] },
    psionicpower: { template: `systems/torgeternity/templates/items/powers-sheet.hbs`, scrollable: [".scrollable"] },
    race: { template: `systems/torgeternity/templates/items/race-sheet.hbs`, scrollable: [".scrollable"] },
    shield: { template: `systems/torgeternity/templates/items/shield-sheet.hbs`, scrollable: [".scrollable"] },
    specialability: { template: `systems/torgeternity/templates/items/specialability-sheet.hbs`, scrollable: [".scrollable"] },
    ["specialability-rollable"]: { template: `systems/torgeternity/templates/items/specialability-rollable-sheet.hbs`, scrollable: [".scrollable"] },
    spell: { template: `systems/torgeternity/templates/items/powers-sheet.hbs`, scrollable: [".scrollable"] },
    vehicle: { template: `systems/torgeternity/templates/items/vehicle-sheet.hbs`, scrollable: [".scrollable"] },
    vehicleAddOn: { template: `systems/torgeternity/templates/items/vehicleAddOn-sheet.hbs`, scrollable: [".scrollable"] },

    // An extra tab to show the "Bestows" inheritance on Items.
    inheritance: { template: `systems/torgeternity/templates/items/item-inheritance-sheet.hbs`, scrollable: [".scrollable"] },
  };

  static TABS = {
    primary: {
      tabs: [
        { id: 'stats' },
        { id: 'perkEnhancements' },  // perks only
        { id: 'perkLimitations' },   // perks only
        { id: 'inheritance' },
        { id: 'effects' },
      ],
      initial: 'stats',
      labelPrefix: 'torgeternity.sheetLabels'
    }
  }

  get title() {
    return `${game.i18n.localize(CONFIG.Item.typeLabels[this.item.type])}: ${this.item.name}`
  }

  /** @inheritdoc */
  _canDragStart(selector) {
    return this.isEditable;
  }

  /** @inheritdoc */
  _canDragDrop(selector) {
    return this.isEditable;
  }

  /** @inheritdoc */
  async _onDragStart(event) {
    const target = event.currentTarget;
    if (target.dataset.effectUuid) {
      const effect = await fromUuid(target.dataset.effectUuid);
      return event.dataTransfer.setData("text/plain", JSON.stringify(effect.toDragData()));
    }
  }

  /** @inheritdoc */
  async _onDrop(event) {
    const dropdata = await fromUuid(foundry.applications.ux.TextEditor.getDragEventData(event)?.uuid, { strict: false });
    if (!dropdata) return;
    switch (dropdata.documentName) {
      case 'Item':
        return this.#onDropItem(dropdata);
      case 'ActiveEffect':
        return this.#onDropActiveEffect(dropdata);
      default:
        console.debug(`Unsupported document type ${dropdata.documentName} onto Item '${this.item.name}`)
    }
  }

  async #onDropItem(item) {
    // Some special rules about dropping onto a Race item
    if (this.item.type === 'race') {
      // A race can't add another race!
      if (item.type === 'race') return;

      if (item.type === 'perk' && item.system.category !== 'racial')
        return ui.notifications.error(game.i18n.format('torgeternity.notifications.notAPerkItem',
          { a: game.i18n.localize('torgeternity.perkTypes.' + item.system.category) })
        );
    }

    // Add the dropped item to the list of bestowed items for this item
    const itemsToBestow = Array.from(this.item.system.itemsToBestow);

    const itemdata = item.toCompendium(/*pack*/ null, { keepId: true });
    if (!itemdata)
      return ui.notifications.info(`Failed to convert ${item.name} into bestowed item`)

    itemsToBestow.push(itemdata);
    return this.item.update({ 'system.itemsToBestow': itemsToBestow });
  }

  async #onDropActiveEffect(effect) {
    if (!effect || !this.item.isOwner) return null;
    //if (effect.target === this.item) return null;  // might be duplicating it
    const keepId = !this.item.effects.has(effect.id);
    const result = await foundry.documents.ActiveEffect.implementation.create(effect.toObject(), { parent: this.item, keepId });
    return result ?? null;
  }

  /**
   *
   * @param html
   */
  async _onRender(context, options) {
    await super._onRender(context, options);

    new foundry.applications.ux.DragDrop.implementation({
      dragSelector: '.draggable',
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        drop: this._onDrop.bind(this),
      }
    }).bind(this.element);

    this.element.querySelectorAll('select.selectSecondaryAxiom').forEach(elem =>
      elem.addEventListener('change', TorgeternityItemSheet.#onSelectSecondaryAxiom.bind(this)));

    if (options.force) {
      // Either window has just been opened, or it has been brought to the top of the stack.
      // When the window is first opened, collapse the traits editor
      const toggleButton = this.element.querySelector('a.toggleTraits');
      if (toggleButton) TorgeternityItemSheet.#onToggleTraitEdit.call(this, null, toggleButton);
    }
  }

  /**
   * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
   * @this {TorgeternityItemSheet}
   */
  static #onEffectControl(event, button) {
    onManageActiveEffect(event, button, this.document);
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static #onConvertRsa(event, button) {
    this.item.update({
      type: 'specialability-rollable',
      "==system": this.item.system
    });
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static #onAddEnhancement(event, button) {
    const newEnhancements = foundry.utils.duplicate(this.item.system.enhancements);
    newEnhancements.push({ taken: false, title: '', description: '' });
    this.item.update({ 'system.enhancements': newEnhancements });
  }

  /**
   * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
   * @this {TorgeternityItemSheet}
   */
  static #onRemoveEnhancement(event, button) {
    const newEnhancements = foundry.utils.duplicate(this.item.system.enhancements);
    newEnhancements.pop();
    this.item.update({ 'system.enhancements': newEnhancements });
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static #onAddLimitation(event, button) {
    const newLimitations = foundry.utils.duplicate(this.item.system.limitations);
    newLimitations.push('');
    this.item.update({ 'system.limitations': newLimitations });
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static #onRemoveLimitation(event, button) {
    const newLimitations = foundry.utils.duplicate(this.item.system.limitations);
    newLimitations.pop();
    this.item.update({ 'system.limitations': newLimitations });
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static #onReloadWeapon(event, button) {
    const usedAmmo = this?.actor.items.get(button.closest('[data-item-id]').dataset.itemId);
    reloadAmmo(this.actor, this.item, usedAmmo, event.shiftKey);
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static async #onSelectSecondaryAxiom(event) {
    const old_selected = this.item.system.secondaryAxiom;
    if (event.target.value === old_selected) return;
    if (old_selected !== 'none')
      await this.item.update({ [`system.axioms.${old_selected}`]: 0 });
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static #onToggleTraitEdit(event, button) {
    const traits = button.parentElement.querySelectorAll('string-tags input, string-tags button, multi-select select');
    if (!traits) return;
    const hidden = !traits[0].disabled;
    for (const elem of traits) elem.disabled = hidden;
    button.classList.remove('fa-square-caret-up', 'fa-square-caret-down');
    button.classList.add(hidden ? 'fa-square-caret-down' : 'fa-square-caret-up');
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static #onItemName(event, button) {
    const section = button.closest('.item');
    const detail = section.querySelector('.item-detail');
    if (!detail) return;
    detail.style.maxHeight = detail.style.maxHeight ? null : (detail.scrollHeight + 'px');
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static #onItemDelete(event, button) {
    const itemid = button.closest('.item').dataset.itemId;
    const bestowedItems = this.item.system.itemsToBestow;

    if (!bestowedItems) return; // just for safety

    for (const itemdata of bestowedItems) {
      if (itemdata._id === itemid) {
        bestowedItems.delete(itemdata);
        break;
      }
    }
    this.item.update({ 'system.itemsToBestow': Array.from(bestowedItems) });
  }

  /**
 * Actions
 * @param {Event} event 
 * @param {HTMLButtonElement} button 
 * @this {TorgeternityItemSheet}
 */
  static #onResetPoss(event, button) {
    if (this.item.type !== 'eternityshard') return;
    return this.item.update({ "system.possibilities.value": this.item.system.possibilities.max })
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // Decide which tabs are required
    switch (this.document.type) {
      case 'perk':
        options.parts = ['header', 'tabs', 'perk', 'perkEnhancements', 'perkLimitations', 'inheritance', 'effects'];
        break;
      case 'race':
        options.parts = ['header', 'tabs', 'race', 'inheritance'];
        break;
      default:
        options.parts = ['header', 'tabs', this.document.type, 'inheritance', 'effects'];
        break;
    }

    if (!this.options.classes.includes(this.item.type))
      this.options.classes.push(this.item.type);
  }

  async _preparePartContext(partId, context, options) {
    const partContext = await super._preparePartContext(partId, context, options);
    //partContext.partId = `${this.id}-${partId}`;
    if (partId === this.item.type)
      partContext.tab = partContext.tabs.stats;   // so template can access tab.cssClass
    else
      partContext.tab = partContext.tabs[partId];   // so template can access tab.cssClass
    return partContext;
  }
  /**
   *
   * @param options
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.systemFields = context.document.system.schema.fields;

    context.effects = prepareActiveEffectCategories(this.document.effects);
    context.item = context.document;
    context.typeLabel = game.i18n.localize(CONFIG.Item.typeLabels[context.document.type]);
    const best = context.item.system.bestowedBy
    context.bestowingItem = best ? context.item.parent.items.get(best) : null;

    // Once copied to an Actor, `item.system.itemsToBestow` is empty.
    context.itemsToBestow = (context.item.parent instanceof foundry.documents.Actor)
      ? context.item.parent.items.filter(item => item.system.bestowedBy === context.item.id)
      : context.item.system.itemsToBestow;
    // Need real items to access `item.isOwner`
    for (const item of context.itemsToBestow) {
      item.description = await foundry.applications.ux.TextEditor.enrichHTML(item.system.description, { secrets: item.isOwner ?? true });
      if (!item.system.traits) item.system.traits = [];
      item.traitDesc = Array.from(item.system.traits.map(trait => game.i18n.localize(`torgeternity.traits.${trait}`))).join(' / ');
    }
    context.itemsToBestow = Array.from(context.itemsToBestow);
    // Can the user modify the list of bestowed items on this item?
    // (not if the item is already on an actor.)
    context.canModifyBestow = !(this.item.parent instanceof foundry.documents.Actor);

    context.config = CONFIG.torgeternity;

    const isOwner = this.item.isOwner;

    context.description = await foundry.applications.ux.TextEditor.enrichHTML(this.document.system.description, { secrets: isOwner });
    context.prerequisites = await foundry.applications.ux.TextEditor.enrichHTML(this.document.system.prerequisites, { secrets: isOwner });
    if (Object.hasOwn(this.document.system, 'good')) {
      context.enrichedGood = await foundry.applications.ux.TextEditor.enrichHTML(this.document.system.good, { secrets: isOwner });
      context.enrichedOutstanding = await foundry.applications.ux.TextEditor.enrichHTML(this.document.system.outstanding, { secrets: isOwner });
    }

    context.hasAmmunition = !game.settings.get('torgeternity', 'ignoreAmmo') && this.document.actor?.itemTypes?.ammunition?.length > 0;
    if (context.hasAmmunition) {
      context.ammunition = this.document.actor?.itemTypes?.ammunition.filter(ammo => ammo.id !== this.document.system.loadedAmmo) ?? [];
      context.loadedAmmunition = this.document.actor?.itemTypes?.ammunition.find(ammo => ammo.id === this.document.system.loadedAmmo) ?? [];
    }

    context.displaySecondaryAxiomValue = this.document.system?.secondaryAxiom !== 'none';

    // tabs?
    if (!this.tabGroups.primary) this.tabGroups.primary = 'stats';
    switch (this.item.type) {
      case 'perk':
        if (this.item.system.extendedNav)
          context.tabs = {
            stats: { group: "primary", id: "stats", label: 'torgeternity.sheetLabels.stats' },
            perkEnhancements: { group: "primary", id: "perkEnhancements", label: 'torgeternity.sheetLabels.enhancements', style: "font-size:10px" },
            perkLimitations: { group: "primary", id: "perkLimitations", label: 'torgeternity.sheetLabels.limitations' },
            inheritance: { group: "primary", id: "inheritance", label: 'torgeternity.sheetLabels.inheritance' },
            effects: { group: "primary", id: "effects", label: 'torgeternity.sheetLabels.effects' },
          };
        else
          context.tabs = {
            stats: { group: "primary", id: "stats", label: 'torgeternity.sheetLabels.stats' },
            inheritance: { group: "primary", id: "inheritance", label: 'torgeternity.sheetLabels.inheritance' },
            effects: { group: "primary", id: "effects", label: 'torgeternity.sheetLabels.effects' },
          };
        break;
      case 'race':
        context.tabs = {
          stats: { group: "primary", id: "stats", label: 'torgeternity.sheetLabels.stats' },
          inheritance: { group: "primary", id: "inheritance", label: 'torgeternity.sheetLabels.inheritance' },
        }
        break;
      default:
        context.tabs = {
          stats: { group: "primary", id: "stats", label: 'torgeternity.sheetLabels.stats' },
          inheritance: { group: "primary", id: "inheritance", label: 'torgeternity.sheetLabels.inheritance' },
          effects: { group: "primary", id: "effects", label: 'torgeternity.sheetLabels.effects' },
        };
        break;
    }
    context.tabs[this.tabGroups.primary].cssClass = 'active';

    if (this.item.type === 'spell') context.axiom = 'magic';
    else if (this.item.type === 'miracle') context.axiom = 'spirit';
    else if (this.item.type === 'psionicpower') context.axiom = 'social';

    return context;
  }

  /**
 *
 * @param {Event} event
 * @param {HTMLButtonElement} button
 * @this {TorgeternityActorSheet}
 */
  static #onShowImage(event, button) {
    const doc = this.document;
    return new foundry.applications.apps.ImagePopout({
      src: doc.img,
      uuid: doc.uuid,
      window: { title: doc.token?.name ?? doc.prototypeToken?.name ?? doc.name },
    }).render({ force: true })
  }
}

/**
 * Reload a weapon with an actor's ammunition item
 *
 * @param {object} actor The actor who holds the weapon
 * @param {object} weapon The used weapon
 * @param {object} ammoItem The Ammo that is used
 * @param {Boolean} ignoreUsage If true, then do NOT decrement the remaining amount of ammunition.
 */
export async function reloadAmmo(actor, weapon, ammoItem, ignoreUsage) {

  const speaker = ChatMessage.getSpeaker({ actor });

  if (weapon.system.ammo.value === weapon.system.ammo.max && !ignoreUsage) {

    if (ammoItem && weapon.system.loadedAmmo != ammoItem.id) {
      await weapon.update({ 'system.loadedAmmo': ammoItem.id });
      return ChatMessage.create({
        content: `${game.i18n.format('torgeternity.chatText.changeAmmoType', { weapon: weapon.name, ammo: ammoItem.name })}`,
        speaker,
      });

    } else {
      return ChatMessage.create({
        content: `${game.i18n.format('torgeternity.chatText.ammoFull', { a: weapon.name })}`,
        speaker,
      });
    }
  }

  if (!ammoItem) {
    // called from the main actor sheet, it's not known what ammo item is used.
    const ammoArray = actor.itemTypes.ammunition;
    if (ammoArray.length === 0) {
      return ChatMessage.create({
        content: `${game.i18n.localize('torgeternity.chatText.noSpareAmmo')}`,
        speaker,
      });
    }

    if (ammoArray.length === 1) {
      ammoItem = ammoArray[0];
    } else {
      let dialogContent =
        '<p>' +
        game.i18n.localize('torgeternity.dialogWindow.chooseAmmo.maintext') +
        '</p><form style="margin-bottom: 1rem"><div style="display:flex;flex-direction: column; list-style: none; align-items:center; gap=3px">';

      for (const ammo of ammoArray) {
        dialogContent += `<span><input id="${ammo.id}" name="chooseAmmoRdb" data-chosen-id="${ammo.id}" type="radio"/>
      <label for="${ammo.id}">${ammo.name}</label>
      </span>`;
      }

      dialogContent += '</form></div>';

      await DialogV2.confirm({
        window: { title: 'torgeternity.dialogWindow.chooseAmmo.windowTitle' },
        content: dialogContent,
        yes: {
          label: `${game.i18n.localize('torgeternity.submit.OK')}`,
          default: true,
          callback: (event, button, dialog) => {
            const checked = dialog.element.querySelector('input:checked');
            if (checked) ammoItem = actor.items.get(checked.dataset.chosenId);
          },
        },
        no: {
          label: `${game.i18n.localize('torgeternity.submit.cancel')}`,
        },
      });

      // Maybe no selection made
      if (!ammoItem) return;
    }
  }

  if (!ignoreUsage && ammoItem.system.quantity <= 0) {
    ui.notifications.error(game.i18n.localize('torgeternity.notifications.clipEmpty'));
    return;
  }
  if (weapon.system.loadedAmmo != ammoItem.id) {
    await ChatMessage.create({
      content: `${game.i18n.format('torgeternity.chatText.changeAmmoType', { weapon: weapon.name, ammo: ammoItem.name })}`,
      speaker,
    });
  }
  await weapon.update({
    'system.loadedAmmo': ammoItem.id,
    'system.ammo.value': weapon.system.ammo.max
  });

  if (!ignoreUsage) {
    await ammoItem.update({ 'system.quantity': ammoItem.system.quantity - 1 });
  }

  await ChatMessage.create({
    content: game.i18n.format('torgeternity.chatText.reloaded', { a: weapon.name }),
    speaker,
  });
}