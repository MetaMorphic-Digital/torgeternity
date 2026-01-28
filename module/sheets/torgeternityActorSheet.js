import { TestResult, renderSkillChat, rollAttack, rollPower, checkUnskilled } from '../torgchecks.js';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../effects.js';
import { oneTestTarget, TestDialog } from '../test-dialog.js';
import TorgeternityItem from '../documents/item/torgeternityItem.js';
import { reloadAmmo } from './torgeternityItemSheet.js';
import { PossibilityByCosm } from '../possibilityByCosm.js';

const { DialogV2 } = foundry.applications.api;

let ro_stormknight;
let ro_threat;

/**
 *
 */
export default class TorgeternityActorSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['torgeternity', 'sheet', 'actor', 'themed', 'theme-light'],
    window: {
      contentTag: 'div',
      contentClasses: ['standard-form'],
      resizable: true,
    },
    position: {
      width: 770,
      height: 860,
    },
    form: {
      submitOnChange: true,
      handler: TorgeternityActorSheet.#onSubmitActorForm,
    },
    actions: {
      toggleThreatSkill: TorgeternityActorSheet.#onToggleThreatSkill,
      toggleStatusEffect: TorgeternityActorSheet.#onToggleStatusEffect,
      skillRoll: TorgeternityActorSheet.#onSkillRoll,
      skillEditToggle: TorgeternityActorSheet.#onSkillEditToggle,
      itemToChat: TorgeternityActorSheet.#onItemChat,
      itemAttackRoll: TorgeternityActorSheet.#onAttackRoll,
      itemTappingRoll: TorgeternityActorSheet.#onTappingRoll,
      interactionAttack: TorgeternityActorSheet.#onInteractionAttack,
      unarmedAttack: TorgeternityActorSheet.#onUnarmedAttack,
      itemPowerRoll: TorgeternityActorSheet.#onPowerRoll,
      itemEquip: TorgeternityActorSheet.#onItemEquip,
      itemCreate: TorgeternityActorSheet.#onItemCreate,
      activeDefenseRoll: TorgeternityActorSheet.#onActiveDefenseRoll,
      activeDefenseRollGlow: TorgeternityActorSheet.#onActiveDefenseCancel,
      effectControl: TorgeternityActorSheet.#onManageActiveEffect, // data-action already on relevant elements
      chaseRoll: TorgeternityActorSheet.#onChaseRoll,
      stuntRoll: TorgeternityActorSheet.#onStuntRoll,
      baseRoll: TorgeternityActorSheet.#onBaseRoll,
      applyFatigue: TorgeternityActorSheet.#onApplyFatigue,
      changeAttributesToggle: TorgeternityActorSheet.#onChangeAttributesToggle,
      increaseAttribute: TorgeternityActorSheet.#onIncreaseAttribute,
      decreaseAttribute: TorgeternityActorSheet.#onDecreaseAttribute,
      openHand: TorgeternityActorSheet.#onOpenHand,
      openPoss: TorgeternityActorSheet.#onCosmPoss,
      itemEdit: TorgeternityActorSheet.#onItemEdit,
      itemDelete: TorgeternityActorSheet.#onItemDelete,
      reloadWeapon: TorgeternityActorSheet.#onReloadWeapon,
      itemName: TorgeternityActorSheet.#onitemName,
      deleteRace: TorgeternityActorSheet.#onDeleteRace,
      removeOperator: TorgeternityActorSheet.#onRemoveOperator,
      removeGunner: TorgeternityActorSheet.#onRemoveGunner,
      resetPoss: TorgeternityActorSheet.#onResetPoss,
    }
  }

  static PARTS = {
    tabs: { template: 'templates/generic/tab-navigation.hbs' },

    title: { template: "systems/torgeternity/templates/actors/stormknight/title.hbs" },
    stats: { template: "systems/torgeternity/templates/actors/stormknight/stats-details.hbs", scrollable: [""] },
    perks: { template: "systems/torgeternity/templates/actors/stormknight/perks-details.hbs", scrollable: [""] },
    gear: { template: "systems/torgeternity/templates/actors/stormknight/gear.hbs", scrollable: [""] },
    powers: { template: "systems/torgeternity/templates/actors/stormknight/powers.hbs", scrollable: [""] },
    effects: { template: "systems/torgeternity/templates/parts/active-effects.hbs", scrollable: [""] },
    background: { template: "systems/torgeternity/templates/actors/stormknight/background.hbs", scrollable: [""] },

    threat: { template: `systems/torgeternity/templates/actors/threat/main.hbs`, scrollable: [".scrollable"] },
    vehicle: { template: `systems/torgeternity/templates/actors/vehicle/main.hbs`, scrollable: [".scrollable"] }
  }

  static TABS = {
    stormknight: {
      tabs: [
        { id: 'stats', },
        { id: 'perks', },
        { id: 'gear', },
        { id: 'powers', },
        { id: 'effects', cssClass: 'scrollable' },
        { id: 'background', label: 'torgeternity.sheetLabels.notes' },
      ],
      initial: "stats",
      labelPrefix: 'torgeternity.sheetLabels'
    },
    threat: {
      tabs: [
        { id: 'stats', },
        { id: 'perks', },
        { id: 'gear', },
        { id: 'powers', },
        { id: 'effects', }, // not scrollable
        { id: 'background', label: 'torgeternity.sheetLabels.notes' },
      ],
      initial: "stats",
      labelPrefix: 'torgeternity.sheetLabels'
    },
    vehicle: {
      tabs: [
        { id: 'stats', },
        { id: 'gear', },
        { id: 'effects' },
        { id: 'background', label: 'torgeternity.sheetLabels.notes' },
      ],
      initial: "stats",
      labelPrefix: 'torgeternity.sheetLabels'
    }
  }

  /**
   *
   * @param {...any} args
   */
  constructor(options = {}) {
    super(options);

    this._filters = { effects: new Set() };
  }

  async _onFirstRender(context, options) {
    // If it is a vehicle with a driver, then watch for changes to the driver's 
    const actor = this.actor;
    if (actor.type === 'vehicle') {
      const operator = actor.system.operator;
      if (operator) operator.apps[this.id] = this;
      for (const item of actor.items) {
        const gunner = item.system.gunner;
        if (gunner) gunner.apps[this.id] = this;
      }
    }
    return super._onFirstRender(context, options);
  }

  _onClose(options) {
    const actor = this.actor;
    if (actor.type === 'vehicle') {
      const operator = actor.system.operator;
      if (operator) delete operator.apps[this.id];
      for (const item of actor.items) {
        const gunner = item.system.gunner;
        if (gunner) delete gunner.apps[this.id];
      }
    }
    super._onClose(options);
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (options.isFirstRender && !this.options.classes.includes(this.actor.type))
      this.options.classes.push(this.actor.type);

    switch (this.actor.type) {
      case 'stormknight':
        options.parts = ['title', 'tabs', 'stats', 'perks', 'gear', 'powers', 'effects', 'background'];
        if (options.isFirstRender) {
          if (options.position.height > window.innerHeight) options.position.height = window.innerHeight;
        }
        break;
      case 'vehicle':
        options.parts = [this.actor.type];
        if (options.isFirstRender) {
          options.position.height = "auto";
        }
        break;
      case 'threat':
        options.parts = [this.actor.type];
        if (options.isFirstRender) {
          options.position.width = 690;
          options.position.height = 645;
        }
        break;
    }
  }

  async _preparePartContext(partId, context, options) {
    const partContext = await super._preparePartContext(partId, context, options);
    if (partId in partContext.tabs) partContext.tab = partContext.tabs[partId];
    return partContext;
  }

  /**
   * @param options
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.tabs = this._prepareTabs(this.actor.type);
    context.systemFields = context.document.system.schema.fields;
    context.items = Array.from(context.document.items);
    context.showPiety = game.settings.get('torgeternity', 'showPiety');
    context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.editAttributes = this.actor.flags.torgeternity?.editAttributes ?? false;

    context.meleeweapons = context.items.filter(item => item.type === 'meleeweapon');
    context.currency = context.items.filter(item => item.type === 'currency');
    context.customAttack = context.items.filter(item => item.type === 'customAttack');
    context.customSkill = context.items.filter(item => item.type === 'customSkill');
    context.gear = context.items.filter(item => item.type === 'gear');
    context.eternityshard = context.items.filter(item => item.type === 'eternityshard');
    context.armor = context.items.filter(item => item.type === 'armor');
    context.shield = context.items.filter(item => item.type === 'shield');
    context.missileweapon = context.items.filter(item => item.type === 'missileweapon');
    context.firearm = context.items.filter(item => item.type === 'firearm');
    context.implant = context.items.filter(item => item.type === 'implant');
    context.heavyweapon = context.items.filter(item => item.type === 'heavyweapon');
    context.vehicle = context.items.filter(item => item.type === 'vehicle');
    context.perk = context.items.filter(item => item.type === 'perk');
    context.spell = context.items.filter(item => item.type === 'spell');
    context.miracle = context.items.filter(item => item.type === 'miracle');
    context.psionicpower = context.items.filter(item => item.type === 'psionicpower');
    context.specialability = context.items.filter(item => item.type === 'specialability');
    context.specialabilityRollable = context.items.filter(item => item.type === 'specialability-rollable');
    context.enhancement = context.items.filter(item => item.type === 'enhancement');
    context.dramaCard = context.items.filter(item => item.type === 'dramaCard');
    context.destinyCard = context.items.filter(item => item.type === 'destinyCard');
    context.cosmCard = context.items.filter(item => item.type === 'cosmCard');
    context.vehicleAddOn = context.items.filter(item => item.type === 'vehicleAddOn');
    context.ammunitions = context.items.filter(item => item.type === 'ammunition');
    context.statusEffects = {};
    this.actor.statuses.forEach(status => context.statusEffects[status] = true);
    context.showConditions = true;

    context.skills = [];
    for (const [key, value] of Object.entries(context.document.system?.skills ?? {})) {
      context.skills.push({
        id: key,
        ...value,
        localName: game.i18n.localize(`torgeternity.skills.${key}`)
      })
    }
    context.skills.sort((a, b) => a.localName.localeCompare(b.localName));

    context.otherSkills = context.skills
      .filter(skill => skill.groupName === 'other')
      .concat(context.customSkill.map(skill => {
        return {
          id: skill.id,
          ...skill.system,
          localName: skill.name,  // already in the local language
          isCustom: true,
        }
      }));

    context.otherSkills.sort((a, b) => a.localName.localeCompare(b.localName));

    if (this.actor.type === 'vehicle') context.operator = this.actor.operator;

    const isOwner = this.actor.isOwner;

    for (const type of [
      'meleeweapons',
      'customAttack',
      'customSkill',
      'gear',
      'eternityshard',
      'armor',
      'shield',
      'missileweapon',
      'firearm',
      'implant',
      'heavyweapon',
      'vehicle',
      'perk',
      'spell',
      'miracle',
      'psionicpower',
      'specialability',
      'specialabilityRollable',
      'enhancement',
      'dramaCard',
      'destinyCard',
      'cosmCard',
      'vehicleAddOn',
    ]) {
      for (const item of context[type]) {
        item.description = await foundry.applications.ux.TextEditor.enrichHTML(item.system.description, { secrets: isOwner });
        item.traitDesc = Array.from(item.system.traits.map(trait => game.i18n.localize(`torgeternity.traits.${trait}`))).join(' / ');
      }
    }

    // Enrich Text Editors
    switch (this.actor.type) {
      case 'stormknight':
        context.enrichedBackground = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.details.background, { secrets: isOwner });
        break;
      case 'threat':
        context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.details.description, { secrets: isOwner });
        break;
      case 'vehicle':
        context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.description, { secrets: isOwner });
    }

    // if (this.actor.system.editstate === undefined) 
    //        this.actor.system.editstate = "none";

    context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());
    context.noDeleteTxFx = true; // Don't allow transferred effects to be deleted

    context.config = CONFIG.torgeternity;
    context.disableXP = !game.user.isGM && game.settings.get('torgeternity', 'disableXP');

    // is the actor actively defending at the moment?
    context.document.defenses.isActivelyDefending = !!this.actor.activeDefense;

    context.ignoreAmmo = game.settings.get('torgeternity', 'ignoreAmmo');

    return context;
  }

  async _onDragStart(event) {
    const target = event.currentTarget;
    if (target.classList.contains('skill-roll'))
      this._skillAttrDragStart(event) // a.skill-roll
    else if (target.classList.contains('interaction-attack') || target.classList.contains('unarmed-attack'))
      this._interactionDragStart(event) // a.interaction-attack
    else if (target.dataset.effectUuid) {
      const effect = await fromUuid(target.dataset.effectUuid);
      event.dataTransfer.setData("text/plain", JSON.stringify(effect.toDragData()));
    } else
      return super._onDragStart(event) // a.item-name, threat: a.item
  }

  // Skills are not Foundry "items" with IDs, so the skill data is not automatically
  //    inserted by Foundry's _onDragStart. Instead we call that function because it
  //    does some needed work and then add in the skill data in a way that will be
  //    retrievable when the skill is dropped on the macro bar.
  /**
   *
   * @param event
   */
  _skillAttrDragStart(event) {
    const data = event.target.dataset;
    const skillAttrData = {
      type: data.testtype,
      data: {
        name: data.customskill ? this.actor.items.get(data.name).name : data.name,
        customskill: (data.customskill === 'true'),
        attribute: data.baseattribute,
        adds: Number(data.adds),
        value: Number(data.value),
        unskilledUse: data.unskilleduse,
        DNDescriptor: 'standard',
      },
    };
    event.dataTransfer.setData('text/plain', JSON.stringify(skillAttrData));
  }

  // See _skillAttrDragStart above.
  /**
   *
   * @param event
   */
  _interactionDragStart(event) {
    const skillNameKey = event.target.dataset.name;
    const skill = this.actor.system.skills[skillNameKey];
    const value = skill.value || (skill.adds + this.actor.system.attributes[skill.baseAttribute].value);
    const skillAttrData = {
      type: 'interaction',
      data: {
        name: skillNameKey,
        attribute: skill.baseAttribute,
        adds: skill.adds,
        value: value,
        unskilledUse: skill.unskilledUse,
      },
    };
    event.dataTransfer.setData('text/plain', JSON.stringify(skillAttrData));
  }

  /**
   *
   * @param html
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    let html = this.element;

    // localizing hardcoded possibility potential value
    if (this.actor.isOwner) {
      html.querySelectorAll('.attributeValueField').forEach(elem =>
        elem.addEventListener('change', event => {
          const target = event.target;
          const concernedAttribute = target.dataset.baseattributeinput;
          this.actor.update({ [`system.attributes.${concernedAttribute}.base`]: parseInt(target.value) });
        }));
    }

    // Register handler to notice changes in the size of the sheet,
    // and update its layout automatically.
    switch (this.actor.type) {
      case 'stormknight':
        if (!ro_stormknight) ro_stormknight = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const cr = entry.contentRect;
            if (cr.width < 510 || cr.height < 650) {
              entry.target.classList.add('compact');
            } else {
              entry.target.classList.remove('compact');
            }
          }
        });
        ro_stormknight.observe(this.element);
        break;

      case 'threat':
        if (!ro_threat) ro_threat = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const cr = entry.contentRect;
            if (cr.height < 630) {
              entry.target.classList.add('tabsOff');
              entry.target.classList.remove('tabsOn');
            } else {
              entry.target.classList.remove('tabsOff');
              entry.target.classList.add('tabsOn');
            }
          }
        });
        ro_threat.observe(this.element);
        break;
    }

    // Everything below here is only needed if the sheet is editable
    if (!context.editable) return;

    // compute adds from total for threats
    if (this.actor.type === 'threat') {
      html.querySelectorAll('.skill-element-edit .inputsFav input').forEach(elem =>
        elem.addEventListener('change', this.#setThreatAdds.bind(this)));
    }
  }

  /** @inheritdoc */
  async _onDrop(event) {
    const actor = this.actor;
    if (!actor.isOwner) return super._onDrop(event);

    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    const document = await fromUuid(data.uuid, { invalid: true });
    if (!document) return super._onDrop(event);

    // Maybe dropping currency, so merge with existing (if any)
    if (document instanceof TorgeternityItem && document.type === 'currency') {
      const currency = actor.items.find(it => it.name === document.name && it.system.cosm === document.system.cosm);
      if (currency) return currency.update({ 'system.quantity': currency.system.quantity + document.system.quantity });
      // not found, so allow creation of new Item to happen later.
    }

    // Maybe dropping an item with a price, so reduce currency
    const itemCost = game.settings.get('torgeternity', 'itemPurchaseCosm');
    if (!event.shiftKey && document instanceof TorgeternityItem && itemCost !== 'free' && actor.type === 'stormknight') {
      const price = Number(document.system?.price);
      let currency;
      if (price && price > 0) {
        let cosm, cosm2;
        switch (itemCost) {
          case 'playerCosm': cosm = actor.system.other.cosm; break;
          case 'itemCosm': cosm = document.system.cosm; break;
          case 'activeScene':
            cosm = game.scenes.active.torg.cosm;
            if (game.scenes.active.torg.isMixed) cosm2 = game.scenes.active.torg.cosm2;
            break;
          case 'askPlayer':
            {
              const choice = await DialogV2.wait({
                classes: ['torgeternity', 'themed', 'theme-dark'],
                window: { title: game.i18n.format('torgeternity.itemPurchase.choice.title', { item: document.name, price }) },
                content: await foundry.applications.handlebars.renderTemplate('systems/torgeternity/templates/actors/currency-choice.hbs', {
                  config: CONFIG,
                  actor: actor,
                  currencies: actor.items.filter(it => it.type === 'currency'),
                  item: document
                }),
                buttons: [{
                  action: "choice",
                  label: "torgeternity.itemPurchase.choice.select",
                  callback: (event, button, dialog) => button.form.elements.choice.value
                }]
              });
              if (!choice) return;  // selection aborted
              if (choice === 'free') {
                // No cost, so add the item to the actor.
                // We can't call super._onDrop because 'event' has been lost due to showing  a dialog!
                return super._onDropItem(event, document);
              }
              currency = actor.items.get(choice);
            }
            break;
        }
        if (cosm) currency = actor.items.find(it => it.type === 'currency' && it.system.cosm === cosm);
        if (!currency || price > currency.system.quantity) {
          // Not enough of 1 currency, so maybe try second currency
          if (cosm2) currency = actor.items.find(it => it.system.cosm === cosm2);
          if (!currency || price > currency.system.quantity) {
            return ui.notifications.warn(game.i18n.format('torgeternity.notifications.insufficientFunds',
              {
                currency: currency?.name ?? game.i18n.localize(CONFIG.torgeternity.cosmTypes[cosm]),
                quantity: currency?.system.quantity ?? 0,
                item: document.name,
                price
              }));
          }
        }
        if (currency) {
          // It appears that 'await currency.update' prevents super._onDrop from working
          await super._onDrop(event);
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            owner: actor,
            content: game.i18n.format('torgeternity.chatText.itemPurchase', {
              item: document.name,
              price,
              currency: currency.name
            })
          });
          return currency.update({ 'system.quantity': currency.system.quantity - price });
        }
      }
    }

    switch (actor.type) {

      case 'stormknight':
        // Check for dropping race onto SK
        if (!(document instanceof TorgeternityItem) || document.type !== 'race') break;

        await this.deleteRace();

        // Add new race and racial abilities
        let docs = await actor.createEmbeddedDocuments('Item', [
          document.toObject(),
          ...document.system.perksData,
          ...document.system.customAttackData
        ]);
        console.log(docs);

        // Mark items are being from the race
        const racedoc = docs.shift();
        for (const item of docs) {
          item.update({ 'system.transferenceID': racedoc.id })
        }

        // Enforce attribute maximums
        const updates = {};
        for (const [key, value] of Object.entries(document.system.attributeMaximum)) {
          if (actor.system.attributes[key].base <= value) continue;

          const proceed = await DialogV2.confirm({
            window: { title: 'torgeternity.dialogWindow.raceDiminishAttribute.title' },
            content: game.i18n.format(
              'torgeternity.dialogWindow.raceDiminishAttribute.maintext',
              { attribute: game.i18n.localize('torgeternity.attributes.' + key), }
            ),
            rejectClose: false,
            modal: true,
          });
          if (proceed) updates[`system.attributes.${key}.base`] = value;
        }
        updates['system.details.sizeBonus'] = document.system.size;

        if (document.system.darkvision)
          updates['prototypeToken.sight.visionMode'] = 'darkvision';

        await actor.update(updates);
        return;

      case 'vehicle':
        if (document instanceof Actor && (document.type === 'stormknight' || document.type === 'threat')) {

          // Is it a driver or a gunner?
          const target = event.target;
          if (target.closest('.vehicle-operator')) {
            // dropped document = driver
            const skillValue = document?.system?.skills[actor.system.type.toLowerCase() + 'Vehicles']?.value ?? 0;
            if (skillValue === 0) {
              ui.notifications.warn(game.i18n.format('torgeternity.notifications.noCapacity', { a: document.name }));
              return;
            }
            actor.update({ 'system.operator': document.id });
          } else {
            // Check for gunner
            const weapon = actor.items.get(target.closest('li.vehicle-weapon-list')?.dataset?.itemId);
            if (weapon) {
              const skillValue = document?.system?.skills[weapon.system.attackWith]?.value ?? 0;
              if (skillValue === 0) {
                ui.notifications.warn(game.i18n.format('torgeternity.notifications.noCapacity', { a: document.name }));
                return;
              }
              weapon.update({ 'system.gunner': document.id });
            }
          }
          return;
        }
    }

    return super._onDrop(event);
  }

  static async #onSubmitActorForm(event, form, formData, options) {
    if (!this.isEditable) return;
    const submitted = foundry.utils.expandObject(formData.object);
    if (submitted.items) {
      const updates = Object.entries(submitted.items).map(([itemid, fields]) => { return { _id: itemid, ...fields } });
      await this.actor.updateEmbeddedDocuments('Item', updates);
    }
    // TODO: Ignore Active Effects on the skill 'adds' values
    if (submitted.system?.skills) {
      for (const skill of Object.keys(submitted.system.skills)) {
        if (Object.hasOwn(submitted.system.skills[skill], "adds")) {
          const AEchange = this.actor.system.skills[skill].adds - this.actor._source.system.skills[skill].adds;
          if (AEchange) {
            formData.object[`system.skills.${skill}.adds`] = submitted.system.skills[skill].adds - AEchange;
          }
        }
      }
    }

    // Now normal ActorSheet form.handler
    return foundry.applications.api.DocumentSheetV2.DEFAULT_OPTIONS.form.handler.call(this, event, form, formData, options);
  }

  /**
   *
   * @param event
   */
  async #setThreatAdds(event) {
    const skill = event.target.dataset.skill;

    if (['0', ''].includes(event.target.value)) {
      // reset the 'skill object' to hide any value (the zero)
      return this.actor.update({
        [`system.skills.${skill}.adds`]: 0,
        [`system.skills.${skill}.value`]: '',
        [`system.skills.${skill}.isThreatSkill`]: false,
      });
    } else if (skill) {
      const skillObject = this.actor.system.skills[skill];
      const computedAdds = event.target?.value - this.actor.system.attributes[skillObject?.baseAttribute].value;
      return this.actor.update({
        [`system.skills.${skill}.adds`]: computedAdds,
        [`system.skills.${skill}.isThreatSkill`]: true,
      });

    }
  }

  /**
   *
   * @param event
   */
  static async #onOpenHand(event, button) {
    let hand = this.actor.getDefaultHand();
    if (!hand) hand = await this.actor.createDefaultHand();
    hand?.sheet.render({ force: true });
  }

  /**
   *
   * @param event
   */
  static async #onCosmPoss(event, button) {
    const actor = this.actor;
    const window = Object.values(ui.windows).find(
      (w) => w.title === game.i18n.localize('torgeternity.sheetLabels.possibilityByCosm')
    );
    if (!window) {
      PossibilityByCosm.create(actor);
    }
  }

  /**
   * Toggle whether the skill is a threat skill not (whether it appears in a Threat sheet's reduced skill list)
   * @param event
   */
  static async #onToggleThreatSkill(event, button) {
    const skillName = button.dataset.name;
    const isThreatSkill = this.actor.system.skills[skillName]?.isThreatSkill;
    const update = { [`system.skills.${skillName}.isThreatSkill`]: !isThreatSkill };
    if (isThreatSkill) {
      update[`system.skills.${skillName}.adds`] = '';
    }
    return this.actor.update(update);
  }

  static async #onToggleStatusEffect(event, button) {
    const statusId = button.dataset.control;
    return this.actor.toggleStatusEffect(statusId);
  }

  /**
   *
   * @param event
   */
  static async #onSkillRoll(event, button) {
    const skillName = button.dataset.name;
    const attributeName = button.dataset.baseattribute;
    const skillValue = Number(button.dataset.value);

    // Before calculating roll, check to see if it can be attempted unskilled; exit test if actor doesn't have required skill
    if (checkUnskilled(skillValue, skillName, this.actor)) return;

    // Check if character is trying to roll on reality while disconnected- must be allowed if reconnection-roll
    let reconnection_attempt = false;
    if (skillName === 'reality' && this.actor.isDisconnected) {
      reconnection_attempt = true;
      const confirmed = await DialogV2.confirm({
        window: { title: 'torgeternity.dialogWindow.realityCheck.title' },
        content: game.i18n.localize('torgeternity.dialogWindow.realityCheck.content'),
      });

      if (!confirmed) {

        foundry.applications.handlebars.renderTemplate(
          './systems/torgeternity/templates/chat/skill-error-card.hbs',
          {
            message: game.i18n.localize('torgeternity.chatText.check.cantUseRealityWhileDisconnected'),
            actor: this.actor.uuid,
            actorPic: this.actor.img,
            actorName: this.actor.name,
          }
        ).then(content =>
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            owner: this.actor,
            content: content
          })
        )
        // Don't wait for chat message to finish posting
        return;
      }
    }

    const dialog = TestDialog.wait({
      testType: button.dataset.testtype,
      customSkill: button.dataset.customskill,
      actor: this.actor,
      isFav:
        this.actor.system.skills[skillName]?.isFav ||
        this.actor.system.attributes?.[skillName + 'IsFav'] ||
        button.dataset.isfav,
      skillName: (button.dataset.testtype === 'attribute') ? attributeName : skillName,
      skillValue: skillValue,
    }, { useTargets: true });

    if (!reconnection_attempt) return dialog;

    switch ((await dialog).flags.torgeternity.test.result) {
      case TestResult.STANDARD:
      case TestResult.GOOD:
      case TestResult.OUTSTANDING:
        await this.actor.toggleStatusEffect('disconnected', { active: false });
        ui.notifications.info(game.i18n.localize('torgeternity.macros.reconnectMacroStatusLiftet'));
        break;
      case TestResult.FAILURE:
        // ChatMessage.create({content: "<p>Fehlschlag</p>"});
        break;
      case TestResult.MISHAP:
        break;
    }
  }

  /**
   *
   * @param event
   */
  static async #onChaseRoll(event, button) {
    if (!game.combat) {
      ui.notifications.info(game.i18n.localize('torgeternity.chatText.check.noTracker'));
      return;
    }

    return TestDialog.wait({
      testType: 'chase',
      actor: this.actor,
      skillName: 'Vehicle Chase',
      skillValue: Number(button.dataset.skillValue),
      DNDescriptor: 'highestSpeed',
      vehicleSpeed: button.dataset.speed,
      maneuverModifier: button.dataset.maneuver,
    }, { useTargets: true });
  }

  /**
   *
   * @param event
   */
  static async #onBaseRoll(event, button) {
    return TestDialog.wait({
      testType: 'vehicleBase',
      actor: this.actor,
      skillName: 'Vehicle Operation',
      skillValue: Number(button.dataset.skillValue),
      vehicleSpeed: button.dataset.speed,
      maneuverModifier: button.dataset.maneuver,
    }, { useTargets: true });
  }

  /**
   *
   * @param event
   */
  static async #onStuntRoll(event, button) {
    const dnDescriptor = (game.user.targets.first()?.actor.type === 'vehicle')
      ? 'targetVehicleDefense' : 'standard';

    return TestDialog.wait({
      testType: 'stunt',
      actor: this.actor,
      skillName: 'Vehicle Stunt',
      skillValue: Number(button.dataset.skillValue),
      DNDescriptor: dnDescriptor,
      vehicleSpeed: button.dataset.speed,
      maneuverModifier: button.dataset.maneuver,
    }, { useTargets: true });
  }

  /**
   *
   * @param event
   */
  static #onInteractionAttack(event, button) {
    let dnDescriptor = 'standard';
    if (game.user.targets.size) {
      switch (button.dataset.name) {
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
      actor: this.actor,
      skillName: button.dataset.name,
      skillAdds: button.dataset.adds,
      skillValue: Number(button.dataset.skillValue),
      isFav: this.actor.system.skills[button.dataset.name].isFav,
      unskilledUse: true,
      DNDescriptor: dnDescriptor,
      type: 'interactionAttack',
    }, { useTargets: true });
  }

  /**
   *
   * @param event
   */
  static #onUnarmedAttack(event, button) {
    let dnDescriptor = 'standard';
    if (game.user.targets.size) {
      const firstTarget = game.user.targets.find(token => token.actor.type !== 'vehicle')?.actor ||
        game.user.targets.first().actor;

      if (firstTarget.type === 'vehicle') {
        dnDescriptor = 'targetVehicleDefense';
      } else {
        firstTarget.items
          .filter((it) => it.type === 'meleeweapon')
          .filter((it) => it.system.equipped).length !== 0
          ? (dnDescriptor = 'targetMeleeWeapons')
          : (dnDescriptor = 'targetUnarmedCombat');
      }
    }

    const skillValue = isNaN(button.dataset.skillValue)
      ? this.actor.system.attributes.dexterity.value
      : Number(button.dataset.skillValue);

    // Almost the same as rollAttack
    return TestDialog.wait({
      testType: 'attack',
      actor: this.actor,
      amountBD: 0,
      isAttack: true,
      isFav: this.actor.system.skills.unarmedCombat.isFav,
      skillName: 'unarmedCombat',
      skillValue: skillValue,
      unskilledUse: true,
      damage: parseInt(button.dataset.damage),
      weaponAP: 0,
      applyArmor: true,
      DNDescriptor: dnDescriptor,
      type: 'attack',
      applySize: true,
      attackOptions: true,
      //chatNote: '',
      bdDamageSum: 0,
      // itemId - no item
    }, { useTargets: true });
  }

  /**
   *
   * @param event
   */
  static #onSkillEditToggle(event, button) {
    event.preventDefault();
    const toggleState = this.actor.system.editstate;
    this.actor.update({ 'system.editstate': !toggleState });
  }

  /**
   *
   * @param event
   */
  static #onActiveDefenseRoll(event, button) {

    return TestDialog.wait({
      testType: 'activeDefense',
      activelyDefending: false,
      actor: this.actor,
      isActiveDefenseRoll: true,
      skillName: 'activeDefense',
      skillAdds: null,
      skillValue: null,
      unskilledUse: true,
      type: 'activeDefense',
    }, { useTargets: true });
  }

  /**
   *
   * @param event
   */
  static async #onActiveDefenseCancel(event, button) {

    return renderSkillChat({
      testType: 'activeDefense',
      activelyDefending: true,
      actor: this.actor.uuid,
      actorPic: this.actor.img,
      actorName: this.actor.name,
      actorType: this.actor.type,
      isAttack: false,
      skillName: 'activeDefense',
      skillAdds: null,
      skillValue: null,
      unskilledUse: true,
      darknessModifier: 0,
      DNDescriptor: 'standard',
      type: 'activeDefense',
      targetAll: game.user.targets.map(token => oneTestTarget(token)), // for renderSkillChat
      applySize: false,
      attackOptions: false,
    });
  }

  /**
   *
   * @param event
   */
  static async #onItemChat(event, button) {
    const item = this.actor.items.get(button.closest('.item').dataset.itemId);
    if (!item) return ui.notifications.info(`Failed to find Item for button`);

    return item.toMessage();
  }

  /**
   *
   * @param event
   */
  static #onAttackRoll(event, button) {
    const item = this.actor.items.get(button.closest('.item').dataset.itemId);
    if (!item) return ui.notifications.info(`Failed to find Item for button`);
    rollAttack(this.actor, item);
  }

  static async #onTappingRoll(event, button) {
    const item = this.actor.items.get(button.closest('.item').dataset.itemId);
    if (!item) return ui.notifications.info(`Failed to find Item for button`);
    const dn = item.system?.tappingDifficulty;
    if (!dn) return ui.notifications.info(`Item does not have a Tapping Difficulty`);

    const skillName = 'reality';
    const skillData = this.actor.system?.skills[skillName];
    if (!skillData) return ui.notifications.info(`Actor does not have the skill ${skillName}`);
    //const attributeName = skillData.baseAttribute;
    const skillValue = Number(skillData.value);

    // Can't use reality while disconnected
    if (this.actor.isDisconnected) {
      return foundry.applications.handlebars.renderTemplate(
        './systems/torgeternity/templates/chat/skill-error-card.hbs',
        {
          message: game.i18n.localize('torgeternity.chatText.check.cantUseRealityWhileDisconnected'),
          actor: this.actor.uuid,
          actorPic: this.actor.img,
          actorName: this.actor.name,
        }
      ).then(content =>
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          owner: this.actor,
          content: content
        })
      )
    }

    return TestDialog.wait({
      testType: 'skill',
      actor: this.actor,
      isFav:
        skillData.isFav ||
        this.actor.system.attributes?.[skillName + 'IsFav'],
      skillName: skillName,
      skillValue: skillValue,
      chatTitle: game.i18n.localize('torgeternity.chatText.tapping'),
      DNDescriptor: 'fixedNumber',
      DNfixed: dn
    });
  }

  /**
   *
   * @param event
   */
  static #onPowerRoll(event, button) {
    const item = this.actor.items.get(button.closest('.item').dataset.itemId);
    if (!item) return ui.notifications.info(`Failed to find Item for button`);
    rollPower(this.actor, item);
  }

  static #onItemEdit(event, button) {
    const item = this.actor.items.get(button.closest('.item').dataset.itemId);
    if (!item) return ui.notifications.info(`Failed to find Item for button`);
    item.sheet.render({ force: true });
  }

  /**
   *
   * @param event
   */
  static #onItemCreate(event, button) {
    event.preventDefault();
    const itemType = button.dataset.itemtype;
    if (!itemType) {
      console.error('Misconfigured itemCreate action, it is missing data-itemtype')
      return;
    }
    if (!Object.hasOwn(CONFIG.Item.typeLabels, itemType)) {
      console.error(`itemCreation actin has invalid data-itemtype '${itemType}'`)
      return;
    }
    return this.actor.createEmbeddedDocuments('Item',
      [{
        name: game.i18n.localize(CONFIG.Item.typeLabels[itemType]),
        type: itemType,
      }],
      { renderSheet: true, });
  }

  /**
   *
   * @param event
   */
  static #onItemEquip(event, button) {
    const itemID = button.closest('.item').dataset.itemId;
    const item = this.actor.items.get(itemID);
    TorgeternityItem.toggleEquipState(item, this.actor);
  }

  static #onManageActiveEffect(event, button) {
    onManageActiveEffect(event, button, this.actor);
  }

  static #onApplyFatigue(event, button) {
    const newShock = this.actor.system.shock.value + parseInt(button.dataset.fatigue);
    this.actor.update({ 'system.shock.value': newShock });
  }

  static #onChangeAttributesToggle(event, button) {
    this.actor.setFlag(
      'torgeternity',
      'editAttributes',
      !this.actor.getFlag('torgeternity', 'editAttributes')
    );
  }
  static #onIncreaseAttribute(event, button) {
    const concernedAttribute = button.dataset.concernedattribute;
    const attributeToChange = this.actor.system.attributes[concernedAttribute].base;
    this.actor.update({
      [`system.attributes.${concernedAttribute}.base`]: attributeToChange + 1,
    });
  }
  static #onDecreaseAttribute(event, button) {
    const concernedAttribute = button.dataset.concernedattribute;
    const attributeToChange = this.actor.system.attributes[concernedAttribute].base;
    this.actor.update({ [`system.attributes.${concernedAttribute}.base`]: attributeToChange - 1 });
  }

  static #onItemDelete(event, button) {
    return DialogV2.confirm({
      window: { title: 'torgeternity.dialogWindow.itemDeletion.title' },
      content: game.i18n.localize('torgeternity.dialogWindow.itemDeletion.content'),
      yes: {
        icon: 'fa-solid fa-check',
        label: 'torgeternity.yesNo.true',
        default: true,
        callback: () => {
          const li = button.closest('.item');
          this.actor.deleteEmbeddedDocuments('Item', [li.dataset.itemId])
        }
      },
      no: {
        icon: 'fa-solid fa-times',
        label: 'torgeternity.yesNo.false',
      },
    });
  }

  static #onReloadWeapon(event, button) {
    const weapon = this.actor.items.get(button.closest('[data-item-id]').dataset.itemId);
    reloadAmmo(this.actor, weapon, null, event.shiftKey);
  }

  static #onitemName(event, button) {
    const section = button.closest('.item');
    const detail = section.querySelector('.item-detail');
    if (!detail) return;
    detail.style.maxHeight = detail.style.maxHeight ? null : (detail.scrollHeight + 'px');
  }

  static async #onDeleteRace(event, button) {
    const raceItem = this.actor.items.find(item => item.type === 'race');
    if (!raceItem) {
      ui.notifications.error(game.i18n.localize('torgeternity.notifications.noRaceToDelete'));
      return;
    }
    if (await DialogV2.confirm({
      window: { title: 'torgeternity.dialogWindow.raceDeletion.title' },
      content: game.i18n.localize('torgeternity.dialogWindow.raceDeletion.content'),
    })) {
      return this.deleteRace();
    }
  }

  static async #onRemoveOperator(event, button) {
    this.document.update({ 'system.operator': null })
  }

  static async #onRemoveGunner(event, button) {
    const weapon = this.document.items.get(button.closest('.vehicle-weapon-list')?.dataset?.itemId);
    if (weapon) weapon.update({ 'system.gunner': null })
  }

  static async #onResetPoss(event, button) {
    this.actor.update({ "system.other.possibilities": 3 });
  }

  async deleteRace() {
    const oldRace = this.actor.items.find(item => item.type === 'race');
    if (oldRace) {
      // Remove old racial abilities.
      // It doesn't remove custom attacks!
      return this.actor.deleteEmbeddedDocuments('Item', [
        oldRace.id,
        ...this.actor.items
          .filter(item => (item.system.transferenceID === oldRace.id) ||
            (item.type === 'perk' && item.system.category === 'racial') ||
            (item.type === 'customAttack' && item.name.includes(oldRace.name)))
          .map(item => item.id),
      ]);
    }
  }
}
