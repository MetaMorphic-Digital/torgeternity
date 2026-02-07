import { rollAttack, rollPower, rollAttribute, rollSkill, rollUnarmedAttack, rollInteractionAttack, rollTapping } from '../torgchecks.js';

// LEFT CLICK to perform ACTION
// RIGHT CLICK to open Item Sheet (ignored on Skills)

export default async function setupTokenActionHud(coreModule) {

  const ATTRIBUTES_ID = "attributesid";
  const SKILLS_ID = 'skillsid';
  const ATTACK_ID = 'combatid';
  const POWERS_ID = 'powersid';
  const GEAR_ID = 'gearid';   // since "gear" is the name of an Item group
  const CONDITION_ID = 'conditionsid';
  const PERKS_ID = 'perksid';

  const ACTION_ATTRIBUTE = 'attribute';
  const ACTION_SKILL = 'skill';
  const ACTION_ATTACK = 'attack';
  const ACTION_ATTACK_INTERACTION = 'attackInteraction';
  const ACTION_POWER = 'power';
  const ACTION_GEAR = 'gear';
  const ACTION_CONDITION = 'conditions';
  const ACTION_PERK = 'perk';

  const FAVOURED = ' \u2606';
  const EQUIPPED = ' \u270b';

  let GROUP = {
    attributes: { id: ATTRIBUTES_ID, name: "torgeternity.sheetLabels.attributes", type: "system" },
    combat: { id: ATTACK_ID, name: "torgeternity.sheetLabels.attacks", type: "system" },
    perks: { id: PERKS_ID, name: "torgeternity.sheetLabels.perks", type: "system" },
    powers: { id: POWERS_ID, name: "torgeternity.sheetLabels.powers", type: "system" },
    gear: { id: GEAR_ID, name: "torgeternity.sheetLabels.gear", type: "system" },
    skills: { id: SKILLS_ID, name: "torgeternity.sheetLabels.skills", type: "system" },
    conditions: { id: CONDITION_ID, name: "torgeternity.sheetLabels.conditions", type: "system" },
  }
  let SUBGROUP = {
    skillsCombat: { id: 'skills_combat', name: "torgeternity.sheetLabels.combatSkills", type: "system" },
    skillsInteraction: { id: 'skills_interaction', name: "torgeternity.sheetLabels.interactionSkills", type: "system" },
    skillsOther: { id: 'skills_other', name: "torgeternity.sheetLabels.otherSkills", type: "system" },
    attacksInteraction: { id: 'combat_interaction', name: "torgeternity.sheetLabels.interactionAttacks", type: "system" },
  }
  for (const key of Object.keys(CONFIG.Item.typeLabels)) {
    if (key === 'base') continue;
    SUBGROUP[key] = { id: key, name: CONFIG.Item.typeLabels[key], type: "system" };
  }

  class MyActionHandler extends coreModule.api.ActionHandler {

    /** @override */
    async buildSystemActions(groupIds) {
      // We don't support MULTIPLE tokens being selected at the same time.
      //this.actors = (!this.actor) ? this._getActors() : [this.actor]
      //this.tokens = (!this.token) ? this._getTokens() : [this.token]
      //this.actorType = this.actor?.type

      const token = this.token;
      if (!token) return;
      const tokenId = token.id;
      const actor = this.actor;
      if (!actor) return;

      if (actor.type !== 'stormknight' && actor.type !== 'threat') return;

      await this.#getAttributes(actor, tokenId, GROUP.attributes);
      await this.#getSkills(actor, tokenId, GROUP.skills);
      await this.#getPowers(actor, tokenId, GROUP.powers);
      await this.#getAttacks(actor, tokenId, GROUP.combat);
      await this.#getGear(actor, tokenId, GROUP.gear);
      await this.#getPerks(actor, tokenId, GROUP.perks);
      await this.#getConditions(actor, tokenId, GROUP.conditions);

      //if (settings.get("showHudTitle")) result.hudTitle = token.name;
    }

    async #getAttributes(actor, tokenId, parent) {
      const actions = Object.entries(actor.system.attributes).map(([key, attribute]) => {
        return {
          id: key,
          name: game.i18n.localize(`torgeternity.attributes.${key}`) + ` (${attribute.value})`,
          encodedValue: [ACTION_ATTRIBUTE, actor.id, tokenId, key].join(this.delimiter),
        }
      })
      const subcat = { id: `${parent.id}-${ATTRIBUTES_ID}`, name: coreModule.api.Utils.i18n('torgeternity.sheetLabels.attributes') };
      this.addGroup(subcat, parent);
      this.addActions(actions, subcat);
    }

    async #getSkills(actor, tokenId, parent) {
      const showUskilled = game.settings.get('torgeternity', 'tahShowUnskilled');
      const allSkills = Object.entries(actor.system.skills)
        .filter(([key, skill]) => showUskilled || (skill.adds))
        .map(([key, skill]) => {
          return {
            id: key,
            name: game.i18n.localize(`torgeternity.skills.${key}`) + (skill.isFav ? FAVOURED : '') + ` (${skill.value || '-'})`,
            groupName: skill.groupName, // for local filtering
            encodedValue: [ACTION_SKILL, actor.id, tokenId, key].join(this.delimiter),
            //img: 'systems/torgeternity/images/icons/custom-skills.webp',
            //img: coreModule.api.Utils.getImage(skill),
            //tooltip: { content: skill.system.description },
            system: skill,
            cssClass: (skill.value === 0) ? "unskilled" : "",
          }
        }).concat(actor.itemTypes.customSkill.map(skill => {
          return {
            id: skill.id,
            name: skill.name + (skill.system.isFav ? FAVOURED : '') + ` (${skill.system.value || '-'})`,  // already in the local language
            groupName: 'other', // for local filtering
            encodedValue: [ACTION_SKILL, actor.id, tokenId, skill.id].join(this.delimiter),
            system: skill
          }
        }));
      allSkills.sort((a, b) => a.name.localeCompare(b.name));

      // up to four groups of skills
      function skillGroup(main, groupName, label) {
        const actions = allSkills.filter(skill => skill.groupName === groupName);
        if (actions.length) {
          const subcat = { id: `skills_${groupName}`, name: coreModule.api.Utils.i18n(label) };
          main.addGroup(subcat, parent);
          main.addActions(actions, subcat);
        }
      }
      skillGroup(this, 'combat', 'torgeternity.sheetLabels.combatSkills');
      skillGroup(this, 'interaction', 'torgeternity.sheetLabels.interactionSkills');
      skillGroup(this, 'other', 'torgeternity.sheetLabels.otherSkills');
    }

    async #createList(parent, actor, tokenId, actionId, items, label, selectedfunc = undefined) {
      // create one sublist
      const actions = items.map(item => {
        return {
          id: item.id,
          name: item.name + (item.system?.equipped ? EQUIPPED : ''),
          encodedValue: [actionId, actor.id, tokenId, item.id].join(this.delimiter),
          img: coreModule.api.Utils.getImage(item),
          tooltip: { content: item.system.description },
          system: item
        }
      })
      for (const item of actions)
        item.tooltip.content = await foundry.applications.ux.TextEditor.enrichHTML(item.tooltip.content,
          {
            secrets: actor.isOwner,
            relativeTo: actor,
          });

      if (actions.length) {
        const subcat = { id: `${parent.id}-${label}`, name: coreModule.api.Utils.i18n(`torgeternity.sheetLabels.${label}`) };
        this.addGroup(subcat, parent);
        this.addActions(actions, subcat);
      }
    }

    async #getPowers(actor, tokenId, parent) {
      await this.#createList(parent, actor, tokenId, ACTION_POWER, actor.itemTypes.spell, 'spells');
      await this.#createList(parent, actor, tokenId, ACTION_POWER, actor.itemTypes.miracle, 'miracles');
      await this.#createList(parent, actor, tokenId, ACTION_POWER, actor.itemTypes.psionicpower, 'psionicPowers');
    }

    async #getPerks(actor, tokenId, parent) {
      await this.#createList(parent, actor, tokenId, ACTION_PERK, actor.itemTypes.perk, 'perks');
    }

    async #getAttacks(actor, tokenId, parent) {
      // Interactions first
      const interactions = ['unarmedCombat', 'intimidation', 'maneuver', 'taunt', 'trick']
        .filter(attack => !actor.system.skills[attack].defenseOnly)
        .map(attack => {
          return {
            id: attack,
            name: game.i18n.localize(`torgeternity.skills.${attack}`) + (actor.system.skills[attack].isFav ? FAVOURED : '') + ` (${actor.system.skills[attack].value})`,
            encodedValue: [ACTION_ATTACK_INTERACTION, actor.id, tokenId, attack].join(this.delimiter),
          }
        });
      if (interactions.length) {
        const subcat = { id: `${parent.id}-interactions`, name: coreModule.api.Utils.i18n(`torgeternity.sheetLabels.interactionAttacks`) };
        this.addGroup(subcat, parent);
        this.addActions(interactions, subcat);
      }

      await this.#createList(parent, actor, tokenId, ACTION_ATTACK, actor.itemTypes.meleeweapon, 'meleeWeapons');
      await this.#createList(parent, actor, tokenId, ACTION_ATTACK, actor.itemTypes.missileweapon, 'missileWeapons');
      await this.#createList(parent, actor, tokenId, ACTION_ATTACK, actor.itemTypes.firearm, 'firearms');
      await this.#createList(parent, actor, tokenId, ACTION_ATTACK, actor.itemTypes.heavyweapon, 'heavyWeapons');
      await this.#createList(parent, actor, tokenId, ACTION_ATTACK, actor.itemTypes["specialability-rollable"], 'specialabilities');
      await this.#createList(parent, actor, tokenId, ACTION_ATTACK, actor.itemTypes.customAttack, 'customAttacks');
    }

    async #getGear(actor, tokenId, parent) {
      await this.#createList(parent, actor, tokenId, ACTION_GEAR, [...actor.itemTypes.armor, ...actor.itemTypes.shield], 'armorAndShields');
      await this.#createList(parent, actor, tokenId, ACTION_GEAR, actor.itemTypes.gear, 'generalGear');
      await this.#createList(parent, actor, tokenId, ACTION_GEAR, actor.itemTypes.implant, 'implants');
      await this.#createList(parent, actor, tokenId, ACTION_GEAR, actor.itemTypes.currency, 'currencies');
      await this.#createList(parent, actor, tokenId, ACTION_GEAR, actor.itemTypes.eternityshard, 'eternityShard');
    }

    async #getConditions(actor, tokenId, parent) {
      const actions = CONFIG.torgeternity.statusEffects.map(status => {
        const result = {
          id: status.id,
          name: game.i18n.localize(status.name),
          encodedValue: [ACTION_CONDITION, actor.id, tokenId, status.id].join(this.delimiter),
          img: coreModule.api.Utils.getImage(status),
          cssClass: `toggle${actor.statuses.has(status.id) ? " active" : ""}`,
        }
        const tooltip = actor.allApplicableEffects().find(effect => effect.statuses?.has(status.id))?.description;
        if (tooltip) result.tooltip = { content: tooltip };
        return result;
      })
      const subcat = { id: `${parent.id}-${CONDITION_ID}`, name: coreModule.api.Utils.i18n('torgeternity.sheetLabels.conditions') };
      this.addGroup(subcat, parent);
      this.addActions(actions, subcat);
    }
  } // MyActionHandler


  /* ROLL HANDLER */

  class MyRollHandler extends coreModule.api.RollHandler {

    /**
     * 
     * @param {Event} event 
     * @param {String} encodedValue 
     * @returns Promise
     */
    async handleActionClick(event, encodedValue) {
      let payload = encodedValue.split(this.delimiter);

      if (payload.length != 4) {
        super.throwInvalidValueErr();
      }

      const [macroType, actorId, tokenId, actionId] = payload;

      const actor = coreModule.api.Utils.getActor(actorId, tokenId);

      switch (macroType) {

        case ACTION_ATTRIBUTE:
          // ActorSheet: skillRoll
          if (this.isRenderItem()) return; // nothing to render
          rollAttribute(this.actor, actionId);
          break;

        case ACTION_SKILL:
          // ActorSheet: skillRoll
          if (this.isRenderItem()) return; // nothing to render
          rollSkill(this.actor, actionId);
          break;

        case ACTION_POWER:
          if (this.isRenderItem()) return this.renderItem(actor, actionId);
          rollPower(actor, actor.items.get(actionId));
          break;

        case ACTION_ATTACK:
          // Sheet: onAttackRoll
          if (this.isRenderItem()) return this.renderItem(actor, actionId);
          rollAttack(actor, actor.items.get(actionId));
          break;

        case ACTION_ATTACK_INTERACTION:
          if (this.isRenderItem()) return; // nothing to render
          if (actionId === 'unarmedCombat')
            rollUnarmedAttack(this.actor, actionId);
          else
            rollInteractionAttack(this.actor, actionId);
          break;

        case ACTION_GEAR:
          if (this.isRenderItem()) return this.renderItem(actor, actionId);
          {
            const item = actor.items.get(actionId);
            switch (item.type) {
              case 'eternityshard':
                return rollTapping(this.actor, item);
            }
          }
          break;

        case ACTION_PERK:
          if (this.isRenderItem()) return this.renderItem(actor, actionId);
          break;

        case ACTION_CONDITION:
          if (this.isRenderItem()) {
            // Render the EFFECT sheet (not the ITEM sheet)
            const effect = actor.allApplicableEffects().find(effect => effect.statuses.has(actionId));
            if (effect) effect.sheet.render({ force: true });
          } else
            this.actor.toggleStatusEffect(actionId);
          break;
      }

      // Ensure the HUD reflects the new conditions
      Hooks.callAll('forceUpdateTokenActionHud');
    }
  } // MyRollHandler


  // Core Module Imports

  class MySystemManager extends coreModule.api.SystemManager {
    /** @override */
    getActionHandler() {
      return new MyActionHandler()
    }

    /** @override */
    getAvailableRollHandlers() {
      const choices = { core: "Core Torg Eternity" };
      return choices
    }

    /** @override */
    getRollHandler(handlerId) {
      return new MyRollHandler()
    }

    /** @override */
    registerSettings(onChangeFunction) {
      game.settings.register('torgeternity', 'tahShowUnskilled', {
        name: game.i18n.localize('torgeternity.settingMenu.tokenActionHud.showUnskilled.name'),
        hint: game.i18n.localize('torgeternity.settingMenu.tokenActionHud.showUnskilled.hint'),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        onChange: value => onChangeFunction(value)
      })
    }

    async registerDefaults() {

      const groups = SUBGROUP;
      Object.values(groups).forEach(group => {
        group.name = game.i18n.localize(group.name);
        group.listName = `Group: ${group.name}`;
      });

      const DEFAULTS = {
        layout: [
          {
            nestId: ATTRIBUTES_ID,
            id: ATTRIBUTES_ID,
            name: game.i18n.localize('torgeternity.sheetLabels.attributes'),
            type: 'system',
            groups: [
              { ...groups.attributes, nestId: `attributes_attribute` },
            ]
          },
          {
            nestId: SKILLS_ID,
            id: SKILLS_ID,
            name: game.i18n.localize('torgeternity.sheetLabels.skills'),
            type: 'system',
            groups: [
              { ...groups.skillsCombat, nestId: "skills_combat" },
              { ...groups.skillsInteraction, nestId: "skills_interaction" },
              { ...groups.skillsOther, nestId: "skills_other" },
            ]
          },
          {
            nestId: ATTACK_ID,
            id: ATTACK_ID,
            name: game.i18n.localize('torgeternity.sheetLabels.attacks'),
            type: 'system',
            groups: [
              { ...groups.attacksInteraction, nestId: "attack_interaction" },
              { ...groups.meleeweapon, nestId: "attack_melee" },
              { ...groups.missileweapon, nestId: "attack_missile" },
              { ...groups.firearm, nestId: "attack_firearm" },
            ]
          },
          {
            nestId: POWERS_ID,
            id: POWERS_ID,
            name: game.i18n.localize('torgeternity.sheetLabels.powers'),
            type: 'system',
            groups: [
              { ...groups.spell, nestId: "power_spell" },
              { ...groups.miracle, nestId: "power_miracle" },
              { ...groups.pisonicpower, nestId: "power_psionic" }
            ]
          },
          {
            nestId: PERKS_ID,
            id: PERKS_ID,
            name: game.i18n.localize('torgeternity.sheetLabels.perks'),
            type: 'system',
            groups: [
              { ...groups.perks, nestId: "perks_perks" },
            ]
          },
          {
            nestId: GEAR_ID,
            id: GEAR_ID,
            name: game.i18n.localize('torgeternity.sheetLabels.gear'),
            type: 'system',
            groups: [
              { ...groups.armor, nestId: "gear_armorAndShields" },
              { ...groups.shield, nestId: "gear_shield" },
              { ...groups.gear, nestId: "gear_generalGear" },
              { ...groups.implant, nestId: "gear_implants" },
              { ...groups.currency, nestId: "gear_currencies" },
              { ...groups.eternityshard, nestId: "gear_eternityshard" },
            ]
          },
          {
            nestId: CONDITION_ID,
            id: CONDITION_ID,
            name: game.i18n.localize('torgeternity.sheetLabels.conditions'),
            type: 'system',
            groups: [
              { ...groups.conditions, nestId: "condition_condition" },
            ]
          },
        ],
        groups: Object.values(groups)
      }

      // HUD CORE v1.2 wants us to return the DEFAULTS
      return DEFAULTS;
    }
  } // MySystemManager

  /* STARTING POINT */

  const module = game.system;
  module.api = {
    requiredCoreModuleVersion: "2.0",
    SystemManager: MySystemManager
  }

  Hooks.call('tokenActionHudSystemReady', module)
}