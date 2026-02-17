import { renderSkillChat } from './torgchecks.js';
import TorgeternityActor from './documents/actor/torgeternityActor.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

function toCamelCase(from) {
  return from.at(0).toLowerCase() + from.slice(1)
}

// Default values for all the fields in the dialog template
const DEFAULT_TEST = {
  // difficulty-selector
  DNDescriptor: "standard",    // number or string
  DNfixed: '',
  // bonus-selector
  bonus: null,      // null or number
  rollTotal: 0,   // 0 = force a manual dice roll
  // favored
  isFav: false,
  disfavored: false,
  skillName: '',
  customSkill: false,
  // movement-penalty
  movementModifier: 0,
  // multi-action
  multiModifier: 0,
  // multi-target
  targetsModifier: 0,
  // attack-options
  calledShotModifier: 0,
  concentratingModifier: 0,
  vitalAreaDamageModifier: false,
  burstModifier: 0,
  allOutFlag: false,
  aimedFlag: false,
  blindFireFlag: false,
  trademark: false,
  additionalDamage: null,   // Number or null
  bdDamageSum: 0,
  addBDs: 0,  // 0-5
  // modifiers
  concealmentModifier: 0,
  other1Description: "",
  other1Modifier: 0,
  other2Description: "",
  other2Modifier: 0,
  other3Description: "",
  other3Modifier: 0,
  // fixed-modifiers
  stymiedModifier: 0,
  darknessModifier: 0,
  waitingModifier: 0,
  vulnerableModifier: 0,
  woundModifier: 0,
  sizeModifier: 0,
  speedModifier: 0,
  maneuverModifier: 0,
  coverModifier: 0,
  // sheet flags
  attackOptions: false,
  isAttack: false,
  applySize: false,
  chatNote: '',
  combinedAction: {
    participants: null,
    torgBonus: 0,
    forDamage: false
  }
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
   * @param {TestData} test The test object
   * @param {Function} resolve ChatMessage of the Roll
   * @param {object} options Foundry base options for the Application
   */
  constructor(test, options = {}) {
    super(options);
    if (CONFIG.debug.torgtest) console.debug('TestDialog.create', test);

    for (const key of Object.keys(test)) {
      if (!(test[key] instanceof String)) continue;
      const num = Number(test[key]);
      if (isNaN(num)) continue;
      console.error(`TestDialog passed a number as a String! (${key} = ${test[key]})`)
      test[key] = num;
    }

    this.mode = test.mode ?? 'create';
    this.test = foundry.utils.mergeObject(DEFAULT_TEST, test, { inplace: false });

    if (this.test.actor instanceof TorgeternityActor) {
      const actor = this.test.actor;
      this.test.actor = actor.uuid;
      this.test.actorPic ??= actor.img;
      this.test.actorName ??= actor.name;
      this.test.actorType ??= actor.type;

      const item = this.test.itemId ? actor.items.get(this.test.itemId) : null;
      if (item) {
        this.test.trademark = item.system.traits.has('trademark');
        this.test.requiresConcentration = item.system.requiresConcentration;
      }

      const combatant = game.combat?.getCombatantsByActor(actor)?.shift();
      if (combatant) {
        const bonus = combatant.currentBonus;
        if (bonus !== undefined) this.test.bonus = bonus;
      }
    }
    // Ensure all relevant fields are Number
    for (const key of Object.keys(DEFAULT_TEST))
      if (typeof DEFAULT_TEST[key] === 'number' && typeof this.test[key] !== 'number')
        this.test[key] = Number(this.test[key]);

    // Immediately display the dialog
    this.render({ force: true });
  }

  /**
   * @inheritDoc 
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // various choice lists
    context.choices = CONFIG.torgeternity.choices;
    context.test = this.test;
    context.config = CONFIG.torgeternity;

    if (this.mode === 'update') {
      context.buttons = [{ type: 'submit', icon: 'fas fa-redo', label: 'torgeternity.sheetLabels.update' }]
      return context;
    }

    // Set Modifiers from Actor Wounds and Status Effects
    const myActor = fromUuidSync(this.test.actor)
    context.test.hasModifiers = false;

    // The wound penalties are never more than -3, regardless on how many wounds a token can suffer / have. CrB p. 117
    context.test.woundModifier = -Math.min(myActor.system.wounds.value ?? 0, 3);

    context.test.stymiedModifier = myActor.statusModifiers.stymied;
    context.test.waitingModifier = myActor.statusModifiers.waiting;
    context.test.targetDarknessModifier = myActor.targetModifiers.darkness;

    // Concentrating modifier applies in Concentration Checks and specific skills
    if (context.test.isConcentrationCheck ||
      CONFIG.torgeternity.concentrationSkills.includes(context.test.skillName)) {
      context.test.concentratingModifier = myActor.statusModifiers.concentrating;
    }
    const testItem = this.test.itemId && myActor.items.get(this.test.itemId);
    context.test.requiresConcentration = testItem?.requiresConcentration;

    // Set Modifiers for Vehicles
    if (this.test.testType === 'chase') {
      if (this.test.vehicleSpeed < 11) {
        context.test.speedModifier = 0;
      } else if (this.test.vehicleSpeed < 15) {
        context.test.speedModifier = 2;
      } else if (this.test.vehicleSpeed < 17) {
        context.test.speedModifier = 4;
      } else {
        context.test.speedModifier = 6;
      }
      // maneuverModifier already set in TorgeternityActorSheet
    } else if (this.test.testType === 'stunt' || this.test.testType === 'vehicleBase') {
      // Do Nothing - this leaves maneuverModifier in place
    } else {
      context.test.speedModifier = 0;
      context.test.maneuverModifier = 0;
    }

    //
    // ***Set Target Data***
    // Transfer data here because passing the entire target to a chat message tends to degrade the data
    //
    const targets = this.options.useTargets ? Array.from(game.user.targets) : [];
    context.test.targetPresent = !!targets.length;
    const MULTITARGET = [0, 0, -2, -4, -6, -8, -10];
    context.test.targetsModifier ||= MULTITARGET[testItem?.hasBlastTrait ? 1 : targets.length] ?? 0;
    context.test.combinedAction.participants ??= game.canvas?.tokens?.controlled?.length || 1;

    if (context.test.targetPresent && context.test.testType !== 'soak') {
      context.test.targetAll = targets.map(token => oneTestTarget(token, this.test.applySize));
      context.test.sizeModifier = Math.max(...context.test.targetAll.map(target => target.sizeModifier));
      context.test.vulnerableModifier = Math.max(...context.test.targetAll.map(target => target.vulnerableModifier));
      context.test.darknessModifier = Math.min(0, Math.min(...context.test.targetAll.map(target => target.darknessModifier)) + context.test.targetDarknessModifier);
    } else {
      context.test.targetAll = dummyTestTargets();
      context.test.sizeModifier = 0;
      context.test.vulnerableModifier = 0;
      context.test.darknessModifier = 0;
    }

    // Maybe there is an explicit amount of damage
    for (const target of context.test.targetAll)
      target.damage = this.test.damage ?? 0;

    context.test.hasModifiers =
      (context.test?.woundModifier ||
        context.test?.stymiedModifier ||
        context.test?.darknessModifier ||
        context.test?.waitingModifier ||
        context.test?.concentratingModifier ||
        context.test?.sizeModifier ||
        context.test?.vulnerableModifier ||
        context.test?.speedModifier ||
        context.test?.maneuverModifier)
        ? true : false;

    context.buttons = [{ type: 'submit', icon: 'fas fa-dice-d20', label: 'torgeternity.sheetLabels.roll' }]
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
    const fields = formData.object;
    foundry.utils.mergeObject(this.test, fields, { inplace: true });

    this.test.explicitBonus = fields.bonus !== null;
    this.test.isOther1 = !!fields.other1Modifier;
    this.test.isOther2 = !!fields.other2Modifier;
    this.test.isOther3 = !!fields.other3Modifier;

    if (this.mode === 'update') {

      this.test.diceroll = null;

    } else {

      // Set DN Descriptor unless actively defending (in which case no DN, but we set to standard to avoid problems down the line)
      if (this.test.testType === 'activeDefense') this.test.DNDescriptor = 'standard';

      //
      // Add attack and target options if needed
      //
      if (this.test.attackOptions) {

        const myActor = fromUuidSync(this.test.actor);
        const myItem = this.test.itemId ? myActor.items.get(this.test.itemId) : null;
        if (
          myItem?.weaponWithAmmo &&
          !myItem.hasSufficientAmmo(this.test.burstModifier, this.test?.targetAll.length || (1 - this.test.targetsModifier / 2))
        ) {
          ui.notifications.warn(game.i18n.localize('torgeternity.chatText.notSufficientAmmo'));
          return;
        }
        this.test.attackTraits = myItem ? Array.from(myItem.system.traits) : [];
        if (myItem?.system?.loadedAmmo) {
          const ammo = myActor.items.get(myItem?.system.loadedAmmo);
          if (ammo) this.test.attackTraits.push(...Array.from(ammo.system.traits));
        }

        // Add Cover Modifier
        this.test.addBDs ??= 0;
        this.test.additionalDamage ??= 0;
        this.test.coverModifier ??= 0;
        this.test.vitalAreaDamageModifier ??= 0;
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
    amountBD: 0,
    bdDamageSum: 0,
    damage: 0,
  }];
}


export function oneTestTarget(token, applySize) {
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

  const damageDefenses = Object.entries(actor.defenses.damageTraits).filter(([_key, value]) => value).reduce((acc, [key, value]) => (acc[key] = value, acc), {})

  // Set vehicle defense if needed
  if (actor.type === 'vehicle') {
    return {
      type: actor.type,
      id: actor.id,
      actorUuid: actor.uuid,
      uuid: token.document.uuid,
      targetPic: actor.img,
      targetName: token.name,
      sizeModifier: sizeModifier,
      toughness: actor.defenses.toughness,
      armor: actor.defenses.armor,
      armorTraits: [],
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
      },
    };
  } else {
    return {
      type: actor.type,
      id: actor.id,
      actorUuid: actor.uuid,
      uuid: token.document.uuid,
      targetPic: actor.img,
      targetName: token.name,
      sizeModifier: sizeModifier,
      toughness: actor.defenses.toughness,
      armor: actor.defenses.armor,
      defenseTraits: actor.defenseTraits,
      // then non-vehicle changes
      skills: actor.items.filter(it => it.type === 'customSkill').reduce((acc, skill) => {
        acc[toCamelCase(skill.name)] = { name: skill.name, ...skill.system };
        return acc;
      }, { ...actor.system.skills }),
      attributes: actor.system.attributes,
      vulnerableModifier: actor.statusModifiers.vulnerable,
      darknessModifier: actor.statusModifiers.darkness,
      isConcentrating: actor.isConcentrating,
      amountBD: 0,
      bdDamageSum: 0,
      defenses: {
        ...damageDefenses,
        dodge: actor.defenses.dodge.value,
        unarmedCombat: actor.defenses.unarmedCombat.value,
        meleeWeapons: actor.defenses.meleeWeapons.value,
        intimidation: actor.defenses.intimidation.value,
        maneuver: actor.defenses.maneuver.value,
        taunt: actor.defenses.taunt.value,
        trick: actor.defenses.trick.value,
        activeDefense: !!actor.activeDefense
      },
    };
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
        result = game.i18n.format('torgeternity.defeat.chatTitle', { attribute: game.i18n.localize('torgeternity.attributes.' + test.skillName) });
      else
        result = `${game.i18n.localize('torgeternity.attributes.' + test.skillName)} ${game.i18n.localize('torgeternity.chatText.test')} `;
      break;
    case 'skill':
      result = (test.customSkill ? (fromUuidSync(test.actor)?.items.get(test.skillName)?.name ?? game.i18n.localize('torgeternity.itemSheetDescriptions.customSkill')) :
        game.i18n.localize('torgeternity.skills.' + test.skillName)) +
        ' ' + game.i18n.localize('torgeternity.chatText.test');
      break;
    case 'interactionAttack':
    case 'attack':
      result = `${game.i18n.localize('torgeternity.skills.' + test.skillName)} ${game.i18n.localize('torgeternity.chatText.attack')}`;
      break;
    case 'soak':
      result = `${game.i18n.localize('torgeternity.sheetLabels.soakRoll')} `;
      break;
    case 'activeDefense':
      result = `${game.i18n.localize('torgeternity.sheetLabels.activeDefense')} `;
      break;
    case 'power':
      result = `${test.powerName} ${game.i18n.localize('torgeternity.chatText.test')} `;
      break;
    case 'chase':
      result = `${game.i18n.localize('torgeternity.chatText.chase')} `;
      break;
    case 'stunt':
      result = `${game.i18n.localize('torgeternity.chatText.stunt')} `;
      break;
    case 'vehicleBase':
      result = `${game.i18n.localize('torgeternity.chatText.vehicleBase')}  `;
      break;
    case 'custom':
      result = test.skillName;
      break;
    default:
      console.log(`--TestDialogLabel: Unknown Test type: ${test.testType}`);
      result = `${test.skillName} ${game.i18n.localize('torgeternity.chatText.test')}  `;
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