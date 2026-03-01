import { TorgeternityMacros } from './macros.js';
import { rollAttack, rollPower } from './torgchecks.js';
import { TestDialog } from './test-dialog.js';

export function initHotbarMacros() {
  game.torgeternity = {
    rollItemMacro,
    rollSkillMacro,
    macros: new TorgeternityMacros(),
  };
}

Hooks.on('hotbarDrop', (bar, dropData, slot) => {

  // return true means we are not handling this event, false means we did handle it
  if (
    dropData.type !== 'Item' &&
    dropData.type !== 'skill' &&
    dropData.type !== 'interaction' &&
    dropData.type !== 'attribute'
  )
    return true;

  createTorgEternityMacro(dropData, slot);
  return false;
});


/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

async function createTorgEternityMacro(dropData, slot) {
  const document = dropData.uuid ? fromUuidSync(dropData.uuid) : dropData.data;
  // Create the macro command
  let command = null;
  let macro = null;
  let macroName = null;
  let macroImg = null;

  if (dropData.type === 'Item') {
    command = `game.torgeternity.rollItemMacro("${document.name}","${document.type}");`;
    macroName = document.name;
    macroImg = document.img;
  } else {
    // attribute, skill, interaction
    const dropName = document.name;
    const dropAttribute = document.attribute;
    const isInteractionAttack = dropData.type === 'interaction';

    command = `game.torgeternity.rollSkillMacro("${dropName}", "${dropAttribute}", ${isInteractionAttack});`;

    const locSkillName = dropData.data.customskill ? dropName : (dropName !== dropAttribute) && game.i18n.localize('torgeternity.skills.' + dropName);
    const locAttributeName = game.i18n.localize('torgeternity.attributes.' + dropAttribute);

    if (dropData.type === 'skill')
      macroName = locSkillName + '/' + locAttributeName;
    else if (dropData.type === 'attribute')
      macroName = locAttributeName;
    else if (dropData.type === 'interaction')
      macroName = locSkillName;

    if (dropData.type === 'attribute') {
      // this is an attribute test
      // use built-in foundry icons
      if (dropAttribute === 'charisma')
        macroImg = 'icons/skills/social/diplomacy-handshake.webp';
      else if (dropAttribute === 'dexterity')
        macroImg = 'icons/skills/movement/feet-winged-boots-brown.webp';
      else if (dropAttribute === 'mind')
        macroImg = 'icons/sundries/books/book-stack.webp';
      else if (dropAttribute === 'spirit')
        macroImg = 'icons/magic/life/heart-shadow-red.webp';
      else if (dropAttribute === 'strength')
        macroImg = 'icons/magic/control/buff-strength-muscle-damage.webp';
    } else {
      // not attribute test
      // don't have skill icons yet
      // macroImg = "systems/torgeternity/images/icons/skill-" + internalSkillName + "-icon.png";
    }
  }

  macro = game.macros.find((m) => m.name === macroName && m.command === command);
  if (!macro) {
    // there is a difference between img: null or img: "" and not including img at all
    // the latter results in default macro icon, the others give broken image icon
    // can remove this when we have skill icons
    const macroData = {
      name: macroName,
      type: 'script',
      command: command,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
    };
    if (macroImg) macroData.img = macroImg;

    macro = await Macro.create(macroData);
  }

  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Triggered to roll for an item on the caller's default character.
 *
 * @param {string} itemName
 * @returns {Promise}
 */
async function rollItemMacro(itemName, itemType) {
  const speaker = ChatMessage.getSpeaker();
  let actor = game.actors.get(speaker.actor) ?? game.actors.tokens[speaker.token];
  let item = actor ? actor.items.find(item => item.name === itemName && (!itemType || item.type === itemType)) : null;
  if (!item) {
    // Maybe a UUID was passed in?
    item = fromUuidSync(itemName, { strict: false });
    if (item)
      actor = item.parent;
    else
      return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noItemNamed') + itemName);
  }

  // Trigger the item roll
  switch (item.type) {
    case 'customAttack':
    case 'meleeweapon':
    case 'missileweapon':
    case 'firearm':
    case 'heavyweapon':
    case 'specialability-rollable':
      rollAttack(actor, item);
      break;

    case 'psionicpower':
    case 'miracle':
    case 'spell':
      rollPower(actor, item);
      break;

    default:
      // this will cause the item to be printed to the chat
      return item.toMessage();
  }
}

/**
 * Create a Macro from a skill, attribute, or interaction (?) drop.
 * Get an existing macro if one exists, otherwise create a new one.
 *
 * @param {string} skillName
 * @param {string} attributeName
 * @param {boolean} isInteractionAttack
 * @returns {Promise}
 */
async function rollSkillMacro(skillName, attributeName, isInteractionAttack, DNDescriptor) {
  let fixedNumber = 0;
  if (DNDescriptor && !isNaN(Number(DNDescriptor))) {
    fixedNumber = Number(DNDescriptor);
    DNDescriptor = 'fixedNumber';
  }

  if (DNDescriptor && !Object.hasOwn(CONFIG.torgeternity.dnTypes, DNDescriptor)) {
    ui.notifications.error('The DN-Descriptor is wrong. Exiting the macro.');
    return;
  }

  let customSkill;
  const speaker = ChatMessage.getSpeaker();
  const actor = game.actors.get(speaker.actor) ?? game.actors.tokens[speaker.token];
  const isAttributeTest = skillName === attributeName;
  const isUnarmed = skillName === 'unarmedCombat';
  let skill = null;
  if (!isAttributeTest) {
    const skillNameKey = skillName; // .toLowerCase(); // skillName required to be internal value
    // would be nice to use display value as an input instead but we can't translate from i18n to internal values
    skill =
      actor && Object.keys(actor.system.skills).includes(skillNameKey)
        ? actor.system.skills[skillNameKey]
        : null;
    // Maybe a custom skill?
    if (!skill && actor) {
      skill = actor.itemTypes.customSkill?.find(it => it.name === skillName)?.system;
      if (skill) customSkill = true;
    }
    if (!skill)
      return ui.notifications.warn(
        game.i18n.localize('torgeternity.notifications.noSkillNamed') + skillName
      );
  }

  const attributeNameKey = attributeName.toLowerCase();
  const attribute =
    actor && Object.keys(actor.system.attributes).includes(attributeNameKey)
      ? actor.system.attributes[attributeNameKey]
      : null;
  if (!attribute)
    return ui.notifications.warn(game.i18n.localize('torgeternity.notifications.noItemNamed'));
  if (isAttributeTest) {
    // dummy skill object since there's no actual skill in this case
    skill = {
      baseAttribute: attributeNameKey,
      adds: 0,
      value: attribute,
      isFav: actor.system.attributes[attributeNameKey + 'IsFav'],
      groupName: 'other',
      unskilledUse: true,
    };
  }

  // calculate the value using the attribute and skill adds, as the attribute might be different
  //    than the skill's current baseAttribute. This assumes the actor is a stormknight - different
  //    logic is needed for threats, who don't have adds.
  let skillValue = attribute.value;
  if (!isAttributeTest) {
    if (actor.type === 'stormknight') {
      skillValue += skill.adds;
    } else if (actor.type === 'threat') {
      const otherAttribute = actor.system.attributes[skill.baseAttribute];
      skillValue = Math.max(skill.value, otherAttribute.value);
    }
  }
  // Trigger the skill roll
  // The following is copied/pasted/adjusted from _onSkillRoll and _onInteractionAttack in TorgeternityActorSheet
  // This code needs to be centrally located!!!
  const test = {
    testType: isAttributeTest ? 'attribute' : 'skill',
    actor: actor,
    skillName: isAttributeTest ? attributeName : skillName,
    skillAdds: skill.adds,
    skillValue: skillValue,
    isFav: skill.isFav,
    DNDescriptor: DNDescriptor ?? 'standard',
    DNfixed: fixedNumber,
    unskilledUse: skill.unskilledUse,
    woundModifier: parseInt(-actor.system.wounds.value),
    stymiedModifier: actor.statusModifiers.stymied,
    darknessModifier: 0, // parseInt(actor.system.darknessModifier),
    type: 'skill',
    bdDamageSum: 0,
    customSkill,
  };

  if (isUnarmed) {
    // see TorgeternityActorSheet.#onUnarmedAttack
    test.testType = 'attack';
    //test.amountBD = 0;
    test.isAttack = true;
    test.unskilledUse = true;
    test.damage = actor.unarmed.damage;
    test.weaponAP = 0;
    test.applyArmor = true;
    test.applySize = true;
    test.attackOptions = true;
    //test.bdDamageSum = 0;

    let dnDescriptor;
    if (game.user.targets.size && !DNDescriptor) {
      const firstTarget = game.user.targets.find(token => token.actor.type !== 'vehicle')?.actor ||
        game.user.targets.first().actor;

      if (firstTarget.type === 'vehicle')
        dnDescriptor = 'targetVehicleDefense';
      else
        dnDescriptor = firstTarget.equippedMelee ? 'targetMeleeWeapons' : 'targetUnarmedCombat';
    }
    test.DNDescriptor = dnDescriptor ?? DNDescriptor;

  } else if (isInteractionAttack) {
    test.testType = 'interactionAttack';
    // Darkness seems like it would be hard to determine if it should apply to
    //    skill/attribute tests or not, maybe should be option in dialog?

    // Exit if no target or get target data
    let dnDescriptor;
    if (game.user.targets.size && !DNDescriptor) {
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
    test.DNDescriptor = dnDescriptor ?? DNDescriptor;
    test.unskilledUse = true;
  }

  return TestDialog.wait(test, { useTargets: true });
}

Hooks.on('getActorContextOptions', async (actorDir, menuItems) => {

  menuItems.unshift({
    name: 'torgeternity.contextMenu.characterInfo.contextMenuTitle',
    icon: '<i class="fa-regular fa-circle-info"></i>',
    callback: async (li) => {
      const actor = actorDir.collection.get(li.dataset.entryId);

      let description = actor.system.details.background ?? actor.system.details.description ?? actor.system.description ?? '';
      description = `<div class="charInfoOutput">${description}</div>`;

      DialogV2.wait({
        classes: ['torgeternity', 'themed', 'theme-dark', 'charInfoOutput'],
        window: {
          title: game.i18n.format('torgeternity.contextMenu.characterInfo.windowTitle', { a: actor.name, }),
          contentClasses: ['scrollable'],
        },
        position: {
          width: 800
        },
        content: await foundry.applications.ux.TextEditor.enrichHTML(description),
        buttons: [
          {
            action: 'close',
            label: 'torgeternity.dialogWindow.buttons.ok',
            callback: () => { },
          },
          {
            action: 'showAllPlayers',
            label: 'torgeternity.dialogPrompts.showToPlayers',
            callback: (event, button, dialog) => {
              ChatMessage.create({
                content: dialog.element.querySelector('.charInfoOutput').outerHTML,
              });
            },
          },
        ]
      });
    },
  });
});
