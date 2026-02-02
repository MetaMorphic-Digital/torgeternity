import { rollAttack, rollPower } from '../torgchecks.js';

// LEFT CLICK to perform ACTION
// RIGHT CLICK to open Item Sheet (ignored on Skills)

export default async function setupTokenActionHud(coreModule) {

  /* ACTIONS */
  const SKILLS_ID = 'skills';
  const ATTACK_ID = 'combat';
  const POWERS_ID = 'powers';

  const ACTION_SKILL = 'skill';
  const ACTION_ATTACK = 'attack';
  const ACTION_POWER = 'power';

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

      if (actor.type !== 'stormknight') return;

      await this.#getSkills(actor, tokenId, { id: SKILLS_ID, type: 'system' })
      await this.#getPowers(actor, tokenId, { id: POWERS_ID, type: 'system' })
      await this.#getAttacks(actor, tokenId, { id: ATTACK_ID, type: 'system' })

      //if (settings.get("showHudTitle")) result.hudTitle = token.name;
    }

    async #getSkills(actor, tokenId, parent) {
      const allSkills = Object.entries(actor.system.skills)
        .map(([key, skill]) => {
          return {
            id: key,
            name: game.i18n.localize(`torgeternity.skills.${key}`),
            groupName: skill.groupName,
            encodedValue: [ACTION_SKILL, actor.id, tokenId, key].join(this.delimiter),
            //img: 'systems/torgeternity/images/icons/custom-skills.webp',
            //img: coreModule.api.Utils.getImage(skill),
            //tooltip: { content: skill.system.description },
            system: skill
          }
        }).concat(actor.itemTypes.customSkill.map(skill => {
          return {
            id: skill.id,
            name: skill.name,  // already in the local language
            groupName: 'other',
            encodedValue: [ACTION_SKILL, actor.id, tokenId, skill.id].join(this.delimiter),
            system: skill
          }
        }));
      allSkills.sort((a, b) => a.name.localeCompare(b.name));

      // up to four groups of skills
      function skillGroup(main, groupName, label) {
        const actions = allSkills.filter(skill => skill.groupName === groupName);
        if (actions.length) {
          const subcat = { id: `skill-${parent.id}-${groupName}`, name: coreModule.api.Utils.i18n(label), type: 'system-derived' };
          main.addGroup(subcat, parent);
          main.addActions(actions, subcat);
        }
      }
      skillGroup(this, 'combat', 'torgeternity.sheetLabels.combatSkills', false);
      skillGroup(this, 'interaction', 'torgeternity.sheetLabels.interactionSkills', true);
      skillGroup(this, 'other', 'torgeternity.sheetLabels.otherSkills', false);
    }

    async #createList(parent, actor, tokenId, actionId, items, label, selectedfunc = undefined) {
      // create one sublist
      const actions = items.map(item => {
        return {
          id: item.id,
          name: item.name,
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
        const subcat = { id: `${parent.id}-${label}`, name: coreModule.api.Utils.i18n(label), type: 'system-derived' };
        this.addGroup(subcat, parent);
        this.addActions(actions, subcat);
      }
    }

    async #getPowers(actor, tokenId, parent) {
      await this.#createList(parent, actor, tokenId, ACTION_POWER, actor.itemTypes.spell, 'Spells');
      await this.#createList(parent, actor, tokenId, ACTION_POWER, actor.itemTypes.miracle, 'Miracles');
      await this.#createList(parent, actor, tokenId, ACTION_POWER, actor.itemTypes.psionicpower, 'Psionics');
    }

    async #getAttacks(actor, tokenId, parent) {
      await this.#createList(parent, actor, tokenId, ACTION_ATTACK, actor.itemTypes.meleeweapon, 'Melee');
      await this.#createList(parent, actor, tokenId, ACTION_ATTACK, actor.itemTypes.missileweapon, 'Missile');
      await this.#createList(parent, actor, tokenId, ACTION_ATTACK, actor.itemTypes.firearm, 'Firearm');
    }
  } // MyActionHandler


  /* ROLL HANDLER */

  class MyRollHandler extends coreModule.api.RollHandler {

    async handleActionClick(event, encodedValue) {
      let payload = encodedValue.split(this.delimiter);

      if (payload.length != 4) {
        super.throwInvalidValueErr();
      }

      const [macroType, actorId, tokenId, actionId] = payload;

      const actor = coreModule.api.Utils.getActor(actorId, tokenId);

      switch (macroType) {
        case ACTION_SKILL:
          // ActorSheet: skillRoll
          if (this.isRightClick) return;
          game.torgeternity.rollSkillMacro(actionId, this.action.system.baseAttribute, /*isInteraction*/ this.action.system.groupName === 'interaction');
          break;
        case ACTION_POWER:
          {
            // Sheet: itemPowerRoll
            const item = actor.items.get(actionId);
            if (item) {
              if (this.isRightClick)
                item.sheet.render({ force: true })
              else
                rollPower(actor, item);
            }
          }
          break;
        case ACTION_ATTACK:
          // Sheet: onAttackRoll
          {
            const item = actor.items.get(actionId);
            if (item) {
              if (this.isRightClick)
                item.sheet.render({ force: true })
              else
                rollAttack(actor, item);
            }
          }
          break;
      }

      // Ensure the HUD reflects the new conditions
      Hooks.callAll('forceUpdateTokenActionHud');
    }
  } // MyRollHandler


  // Core Module Imports

  class MySystemManager extends coreModule.api.SystemManager {
    /** @override */
    getActionHandler(categoryManager) {
      return new MyActionHandler(categoryManager)
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
    /*registerSettings (onChangeFunction) {
        systemSettings.register(onChangeFunction)
    }*/

    async registerDefaults() {

      const SKILLS_NAME = game.i18n.localize('torgeternity.sheetLabels.skills');
      const COMBAT_NAME = game.i18n.localize('torgeternity.sheetLabels.attacks');
      const POWERS_NAME = game.i18n.localize('torgeternity.sheetLabels.powers');

      const DEFAULTS = {
        layout: [
          {
            nestId: SKILLS_ID + "-title",
            id: SKILLS_ID + "-title",
            name: SKILLS_NAME,
            type: 'system',
            groups: [
              {
                nestId: 'skills-title_skills',
                id: SKILLS_ID,
                name: SKILLS_NAME,
                type: 'system'
              }
            ]
          },
          {
            nestId: ATTACK_ID + "-title",
            id: ATTACK_ID + "-title",
            name: COMBAT_NAME,
            type: 'system',
            groups: [
              {
                nestId: 'combat-title_combat',
                id: ATTACK_ID,
                name: COMBAT_NAME,
                type: 'system'
              }
            ]
          },
          {
            nestId: POWERS_ID + "-title",
            id: POWERS_ID + "-title",
            name: POWERS_NAME,
            type: 'system',
            groups: [
              {
                nestId: 'powers-title_powers',
                id: POWERS_ID,
                name: POWERS_NAME,
                type: 'system'
              }
            ]
          },
        ],
        groups: [
          { id: ATTACK_ID, name: COMBAT_NAME, type: 'system' },
          { id: SKILLS_ID, name: SKILLS_NAME, type: 'system' },
          { id: POWERS_ID, name: POWERS_NAME, type: 'system' },
        ]
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