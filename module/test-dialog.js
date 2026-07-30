import { renderSkillChat } from './torgchecks.js';
import TorgeternityActor from './documents/actor/torgeternityActor.js';
import { applyNumericEffects } from './torgchecks.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

function toCamelCase(from) {
  return from.at(0).toLowerCase() + from.slice(1)
}

export class TestDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  testMessage;

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['torgeternity', 'application', 'test-dialog', 'themed', 'theme-dark'],
    window: {
      resizable: false,
      contentClasses: ['standard-form'],
    },
    form: {
      handler: TestDialog.#onRoll,
      submitOnChange: false,
      closeOnSubmit: true,
    }
  }

  static PARTS = {
    create: { template: 'systems/torgeternity/templates/test-dialog.hbs' },
    update: { template: 'systems/torgeternity/templates/test-update.hbs' },
    footer: { template: "templates/generic/form-footer.hbs" },
  }

  get title() {
    let label = TestDialogLabel(this.test, false);
    // if (this.itemId) label = fromUuidSync(this.actor)?.items.get(this.itemId)?.name;
    return label ?? 'Skill Test';
  }
  /**
   *
   * @param {TestData} test the test object
   * @param {object} options Foundry base options for the Application
   * @returns {Promise<ChatMessageTorg|undefined>} The ChatMessage of the Roll
   */
  static wait(test, options) {
    return new Promise(resolve => new TestDialog(test, { ...options, callback: resolve }));
  }

  /**
   *
   * @param {ActionCheckData} test The test object
   * @param {Function} resolve ChatMessage of the Roll
   * @param {object} options Foundry base options for the Application
   */
  constructor(test, options = {}) {
    const actor = test.actor;
    super(options);
    this.test = new CONFIG.ChatMessage.dataModels.action(test);

    if (actor instanceof TorgeternityActor)
      this.test.setActor(actor, this.test.itemId);

    if (options.useTargets && game.user.targets.size)
      this.test.setTargets(Array.from(game.user.targets))
    else if (this.test.targetSelf)
      this.test.setTargets(fromUuidSync(this.test.actor).getActiveTokens())
    // After adding Actor and Targets, we can apply modifiers from effects
    this.test.applyEffects();

    if (CONFIG.debug.torgtest) console.debug('TestDialog.create', test);

    this.mode = test.mode ?? 'create';

    // Immediately display the dialog
    this.render({ force: true, ...options });
  }

  /**
   * @inheritDoc 
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // various choice lists
    context.choices = CONFIG.torgeternity.choices;
    context.test = this.test.toObject();
    context.config = CONFIG.torgeternity;

    context.buttons = (this.mode === 'update') ?
      [{ type: 'submit', icon: 'fas fa-redo', label: 'torgeternity.sheetLabels.update' }] :
      [{ type: 'submit', icon: 'fas fa-dice-d20', label: 'torgeternity.sheetLabels.roll' }]

    return context;
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    switch (this.mode) {
      case 'create': options.parts = ['create', 'footer']; break;
      case 'update': options.parts = ['update', 'footer']; break;
    }
  }

  /**
   * @inheritDoc 
   */
  _onChangeForm(config, event) {
    super._onChangeForm(config, event);
    if (event.target.name === 'DNDescriptor') {
      const elem = this.form.querySelector('input#DNfixed');
      if (elem) elem.style.display = (event.target.value === 'fixedNumber') ? 'block' : 'none';
    }
  }

  /**
   *
   * @param event
   * @param html
   */
  static async #onRoll(event, form, formData) {
    const fields = foundry.utils.expandObject(formData.object);
    fields.explicitBonus = fields.bonus !== null;
    this.test.updateSource(fields);

    if (this.mode !== 'update' && this.test.attackOptions) {
      const myItem = this.test.itemId && fromUuidSync(this.test.actor).items.get(this.test.itemId);
      if (
        myItem?.weaponWithAmmo &&
        !myItem.hasSufficientAmmo(this.test.burstModifier, this.test?.targets.length || (1 - this.test.targetsModifier / 2))
      ) {
        ui.notifications.warn(_loc('torgeternity.chatText.notSufficientAmmo'));
        return;
      }
    }

    if (CONFIG.debug.torgtest) console.debug('TestDialog.onRoll', this.test);

    const message = await renderSkillChat(this.test);
    if (message && this.options.callback) {
      this.options.callback(message);
    }
    this.close();
  }
}

export function dummyTestTargets() {
  return [{
    dummyTarget: true,
    type: 'dummy',
  }];
}

/**
 * 
 * @param {TorgeternityToken} token 
 * @param {Boolean} applySize 
 * @param {Set[String]} attackTraits attackTraits of the attacker (if any)
 * @param {Set[String]} defenseTraits defenseTraits of the attacker (if any)
 * @returns 
 */
export function oneTestTarget(token, applySize, attackTraits, defenseTraits, testSkill, actingToken, actingItem) {
  const actor = token.actor;

  let sizeModifier;
  if (applySize) {
    switch (actor.system.details.sizeBonus) {
      case 'normal': sizeModifier = 0; break;
      case 'tiny': sizeModifier = -6; break;
      case 'verySmall': sizeModifier = -4; break;
      case 'small': sizeModifier = -2; break;
      case 'large': sizeModifier = 2; break;
      case 'veryLarge': sizeModifier = 4; break;
      default: sizeModifier = 0; break;
    }
  }

  const damageDefenses = Object.entries(actor.system.defenses.damageTraits)
    .filter(([_key, value]) => value)
    .reduce((acc, [key, value]) => (acc[key] = value, acc), {})

  let rangeModifier = 0;
  if (actingToken && actingItem?.system?.rangePenalty)
    rangeModifier = actingItem.system.rangePenalty(token.distanceToToken(actingToken));

  // Set vehicle defense if needed
  switch (actor.type) {
    case 'vehicle':
      return {
        type: actor.type,
        id: actor.id,
        actorUuid: actor.uuid,
        uuid: token.document.uuid,
        targetPic: actor.img,
        targetName: token.name,
        sizeModifier: sizeModifier,
        toughness: actor.system.defenses.toughness,
        armor: actor.system.defenses.armor,
        defenseTraits: actor.defenseTraits,
        rangeModifier,
        amountBD: 0,
        bdDamageSum: 0,
        // then vehicle specifics
        defenses: {
          ...damageDefenses,
          vehicle: actor.system.defense,
          dodge: actor.system.defense,
          unarmedCombat: actor.system.defense,
          meleeWeapons: actor.system.defense,
          intimidation: actor.system.defense,
          maneuver: actor.system.defense,
          taunt: actor.system.defense,
          trick: actor.system.defense,
          activeDefense: actor.system.defenses.activeDefense
        },
      };

    case 'threat':
    case 'stormknight':
      {
        const result = {
          type: actor.type,
          id: actor.id,
          actorUuid: actor.uuid,
          uuid: token.document.uuid,
          targetPic: actor.img,
          targetName: token.name,
          sizeModifier: sizeModifier,
          toughness: actor.system.defenses.toughness,
          armor: actor.system.defenses.armor,
          defenseTraits: actor.defenseTraits,
          rangeModifier,
          // then non-vehicle changes
          skills: actor.itemTypes.customSkill.reduce((acc, skill) => {
            acc[toCamelCase(skill.name)] = { value: skill.system.value, defenseMod: skill.system.defenseMod, baseAttribute: skill.system.baseAttribute };
            return acc;
          },
            Object.entries(actor.system.skills).reduce((acc, [skillName, skill]) => {
              acc[skillName] = { value: skill.value, defenseMod: skill.defenseMod ?? 0, baseAttribute: skill.baseAttribute }
              return acc;
            }, {})),
          attributes: Object.entries(actor.system.attributes).reduce((acc, [key, attr]) => (acc[key] = attr.value + attr.defenseMod, acc), {}),
          vulnerableModifier: actor.system.statusModifiers.vulnerable,
          darknessModifier: actor.system.statusModifiers.darkness,
          isConcentrating: actor.isConcentrating,
          amountBD: 0,
          bdDamageSum: 0,
          defenses: {
            ...damageDefenses,
            dodge: actor.system.defenses.dodge.value,
            unarmedCombat: actor.system.defenses.unarmedCombat.value,
            meleeWeapons: actor.system.defenses.meleeWeapons.value,
            intimidation: actor.system.defenses.intimidation.value,
            maneuver: actor.system.defenses.maneuver.value,
            taunt: actor.system.defenses.taunt.value,
            trick: actor.system.defenses.trick.value,
            activeDefense: actor.system.defenses.activeDefense
          },
        };

        // Check for any AEs on the defender with the `defendAgainstTrait` set
        if (attackTraits?.length || defenseTraits?.length) {
          const effects = [];
          for (const effect of actor.allApplicableEffects()) {
            // It will be suppressed, so effect.active will return false
            if (!effect.disabled && !effect.system.transferOnOutcome && effect.system.defendAgainstTrait.size) {
              let found = 0;
              const required = effect.system.defendAgainstTraitCombine === 'or' ? 1 : effect.system.defendAgainstTrait.size;
              for (const trait of effect.system.defendAgainstTrait) {
                if (testSkill === trait || attackTraits?.includes(trait) || defenseTraits?.includes(trait)) {
                  if (++found === required) break;
                }
              }
              if (found === required) effects.push(effect);
            }
          }
          const changekeys = effects.map(effect => effect.system.changes).flat().reduce((set, change) => set.add(change.key), new Set());
          for (const changekey of changekeys) {
            if (changekey === 'system.defenses.all.mod') {
              for (const field of ['defenses.dodge', 'defenses.unarmedCombat', 'defenses.meleeWeapons', 'defenses.intimidation', 'defenses.maneuver', 'defenses.taunt', 'defenses.trick']) {
                const value = foundry.utils.getProperty(result, field);
                if (typeof value !== 'number')
                  console.warn(`Non-numeric field referenced in changes of defendAgainstTrait: '${field}'`)
                else
                  foundry.utils.setProperty(result, field, applyNumericEffects(changekey, value, effects));
              }
            } else if (changekey === 'system.defenses.physical.mod') {
              for (const field of ['defenses.dodge', 'defenses.unarmedCombat', 'defenses.meleeWeapons']) {
                const value = foundry.utils.getProperty(result, field);
                if (typeof value !== 'number')
                  console.warn(`Non-numeric field referenced in changes of defendAgainstTrait: '${field}'`)
                else
                  foundry.utils.setProperty(result, field, applyNumericEffects(changekey, value, effects));
              }
            } else if (changekey === 'system.defenses.interaction.mod') {
              for (const field of ['defenses.intimidation', 'defenses.maneuver', 'defenses.taunt', 'defenses.trick']) {
                const value = foundry.utils.getProperty(result, field);
                if (typeof value !== 'number')
                  console.warn(`Non-numeric field referenced in changes of defendAgainstTrait: '${field}'`)
                else
                  foundry.utils.setProperty(result, field, applyNumericEffects(changekey, value, effects));
              }
            } else {
              const MAPPING = {
                'system.defenses.toughness': 'toughness',
                'system.defenses.armor': 'armor',
                'system.statusModifiers.vulnerable': 'vulnerableModifier',
                'system.statusModifiers.darkness': 'darknessModifier',
              }
              const field = MAPPING[changekey] ?? changekey.replace(/^system./, '').replace(/.mod$/, '');
              const value = foundry.utils.getProperty(result, field);
              if (typeof value !== 'number')
                console.warn(`Non-numeric field referenced in changes of defendAgainstTrait: '${field}'`)
              const newvalue = applyNumericEffects(changekey, value, effects);
              foundry.utils.setProperty(result, field, newvalue);
              // Armor should be included in the toughness value (and will be removed if required later)
              if (field === 'armor') result.toughness += (newvalue - value);
            }
          }
        }

        return result;
      }

    default:
      console.warn(`Unknown actor type ${oneTestTarget}`);
      return null;
  }
}

/**
 * 
 * @param {Object} test The Label for this test will be generated
 * @param {Boolean} multiline Whether a multiline label should be generated
 * @returns {String} A label for the test.
 */
export function TestDialogLabel(test, multiline) {
  let result;

  switch (test.testType) {
    case 'attribute':
      if (test.isDefeatTest)
        result = _loc('torgeternity.defeat.chatTitle', { attribute: _loc('torgeternity.attributes.' + test.skillName) });
      else
        result = `${_loc('torgeternity.attributes.' + test.skillName)} ${_loc('torgeternity.chatText.test')} `;
      break;
    case 'skill':
      result = (test.customSkill ? (fromUuidSync(test.actor)?.items.get(test.skillName)?.name ?? _loc('torgeternity.itemSheetDescriptions.customSkill')) :
        _loc('torgeternity.skills.' + test.skillName)) +
        ' ' + _loc('torgeternity.chatText.test');
      break;
    case 'interactionAttack':
    case 'attack':
      result = `${_loc('torgeternity.skills.' + test.skillName)} ${_loc('torgeternity.chatText.attack')}`;
      break;
    case 'soak':
      result = `${_loc('torgeternity.sheetLabels.soakRoll')} `;
      break;
    case 'activeDefense':
      result = `${_loc('torgeternity.sheetLabels.activeDefense')} `;
      break;
    case 'power':
      result = `${test.powerName} ${_loc('torgeternity.chatText.test')} `;
      break;
    case 'chase':
      result = `${_loc('torgeternity.chatText.chase')} `;
      break;
    case 'stunt':
      result = `${_loc('torgeternity.chatText.stunt')} `;
      break;
    case 'vehicleBase':
      result = `${_loc('torgeternity.chatText.vehicleBase')}  `;
      break;
    case 'custom':
      result = test.skillName;
      break;
    default:
      console.log(`--TestDialogLabel: Unknown Test type: ${test.testType}`);
      result = `${test.skillName} ${_loc('torgeternity.chatText.test')}  `;
  }
  if (test.itemId) {
    const item = fromUuidSync(test.actor, { strict: false })?.items.get(test.itemId);
    if (item) {
      result +=
        `${multiline ? '<br>' : ' '}(${item.name}${item.system?.traits?.has('trademark') ? '\u2122' : ''})`;
    }
  }
  return result;
}