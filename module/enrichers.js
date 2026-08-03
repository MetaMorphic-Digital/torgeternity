import { TestDialog } from './test-dialog.js';
import { torgDamage, torgDamageModifiers } from './torgchecks.js';

function sanitizeNumbers(obj) {
  for (const [key, value] of Object.entries(obj))
    if (typeof value === 'string' && value.length) {
      let num = Number(value);
      if (!isNaN(num)) obj[key] = num;
    }
}

/**
 * INLINE CHECKS
 */

// @Check[thing|dn:difficulty]{label}
const InlineCheckPattern = /@Check\[(.+?)\](?:\{(.+?)\}){0,1}/g;

function guessLabel(check) {
  if (Object.hasOwn(CONFIG.torgeternity.attributeTypes, check))
    return _loc(CONFIG.torgeternity.attributeTypes[check]);
  else if (Object.hasOwn(CONFIG.torgeternity.skills, check))
    return _loc(CONFIG.torgeternity.skills[check]);
  else if (Object.hasOwn(CONFIG.torgeternity.dnTypes, check))
    return _loc(CONFIG.torgeternity.dnTypes[check]);
  else if (Object.hasOwn(CONFIG.torgeternity.dnTypes, `target${check.capitalize()}`))
    return _loc(CONFIG.torgeternity.dnTypes[`target${check.capitalize()}`]);
  else
    return check;
}

/**
 * The enricher to create the link when a page is displayed.
 * @param {*} match 
 * @param {*} options 
 * @returns 
 */
function InlineCheckEnricher(match, options) {
  const parts = match[1].split('|');
  let label = match[2];
  const checks = parts.shift().split(',');
  const anchors = [];

  const dataset = {}
  for (const elem of parts) {
    const [key, value] = elem.split("=");
    dataset[key] = value ?? true;
  }

  for (const check of checks) {
    // Decode each of the parameters: DN, <skill>, <attribute>, <other>
    dataset.testType = check;

    // Create the base anchor
    const anchor = foundry.applications.ux.TextEditor.createAnchor({
      //attrs: null, 
      dataset,
      name: label ?? guessLabel(check),
      classes: ['torg-inline-check'],
      icon: "fa-solid fa-dice-d20"
    });
    // Add we are manually creating a label, place the DN in a separate span
    if (!label && dataset.dn) {
      const span = document.createElement('span');
      span.classList.add('dn');
      span.append(` (${_loc('torgeternity.sheetLabels.dn')} ${guessLabel(dataset.dn)})`);
      anchor.append(span);
    }
    // Append a button to copy the link to chat (only when in Journal)
    if (!options.rollData && game.user.isGM && anchors.length / 2 === checks.length - 1) {
      const icon = document.createElement("i");
      icon.classList.add('icon', 'fa-solid', 'fa-comment', 'toChat');
      icon.dataset.original = match[0];
      anchor.append(icon);
    }
    anchors.push(anchor);
    if (checks.length > 1) anchors.push(' '); // will become a TEXT element
  }
  if (anchors.length === 1) return anchors[0];
  const globalspan = document.createElement('span');
  globalspan.append(...anchors);

  return globalspan;
}

const interactionAttacks = ['unarmed', 'intimidation', 'maneuver', 'taunt', 'kick'];

/**
 * The click handler to trigger the Test Dialog when the button is clicked.
 * @param {Event} event 
 */
function _onClickInlineCheck(event) {
  // Firstly check for clicking on the "post to chat" button
  if (event.target.dataset.original) {
    return ChatMessage.implementation.create({ content: event.target.dataset.original })
  }

  const target = event.target.closest('a.torg-inline-check');
  const test = { ...target.dataset };
  sanitizeNumbers(test);

  // Same test as in 'rollSkillMacro'
  const speaker = ChatMessage.implementation.getSpeaker();
  const actor = ChatMessage.implementation.getSpeakerActor(speaker);
  if (!actor) return ui.notifications.warn(_loc('torgeternity.notifications.noTokenNorActor'));

  if (test.dn) {
    const dnmap = {
      "6": "veryEasy",
      "8": "easy",
      "10": "standard",
      "12": "challenging",
      "14": "hard",
      "16": "veryHard",
      "18": "heroic",
      "20": "nearImpossible",
    }
    test.dn = dnmap[test.dn] ?? test.dn;
    if (!isNaN(Number(test.dn))) {
      test.DNfixed = Number(test.dn);
      test.dn = 'fixedNumber';
    }
  } else
    test.dn = 'standard';

  // use 'actor' simply to get the full list of attributes, defenses and skills
  if (Object.hasOwn(CONFIG.torgeternity.attributeTypes, test.dn) ||
    Object.hasOwn(actor.system.defenses, test.dn) ||
    Object.hasOwn(CONFIG.torgeternity.skills, test.dn)) {
    test.DNDescriptor = `target${test.dn.capitalize()}`;
  } else {
    if (!Object.hasOwn(CONFIG.torgeternity.dnTypes, test.dn)) {
      ui.notifications.warn('Unrecognized DN in check', { field: test.dn });
      return;
    }
    test.DNDescriptor = test.dn ?? (interactionAttacks.includes(test.testType) ? `target${test.testType.capitalize()}` : 'standard');
  }

  if (actor.system?.skills?.[test.testType]) {
    // skill test
    const skillName = test.testType;
    const skill = actor.system.skills[skillName];
    if (!skill) return ui.notifications.warn(_loc('torgeternity.notifications.noSkillNamed') + skillName);
    const attribute = actor.system.attributes[test.attribute ?? skill.baseAttribute];
    if (!attribute) return ui.notifications.warn(_loc('torgeternity.notifications.noItemNamed'));

    let skillValue = attribute.value;
    if (actor.type === 'stormknight')
      skillValue += skill.adds;
    else if (actor.type === 'threat')
      skillValue += Math.max(skill.value, attribute.value);
    const isInteractionAttack = (test.attack || interactionAttacks.includes(skillName));

    if (!test.unskilledUse && actor.preventUnskilled(skill.value, skillName)) return;

    foundry.utils.mergeObject(test, {
      testType: isInteractionAttack ? 'interactionAttack' : 'skill',
      skillName: skillName,
      skillValue: skillValue,
      isFav: skill.isFav,
      unskilledUse: skill.unskilledUse || isInteractionAttack,
    }, { inplace: true })

  } else if (actor.system?.attributes?.[test.testType]) {
    // attribute test
    const attributeName = test.testType;
    const attribute = actor.system.attributes[attributeName];

    foundry.utils.mergeObject(test, {
      testType: test.attack ? 'interactionAttack' : 'attribute',
      skillName: attributeName,
      skillValue: attribute.value,
      isFav: actor.system.attributes[attributeName].isFav,
      unskilledUse: true,
    }, { inplace: true });

  } else {
    // Not skill or attribute, so anything can be set in the test.
    // @Check[interactionAttack|skillName=intimidation|dn=targetIntimidation|unskilledUse=true]
    if (test.skillName && actor.system.skills[test.skillName]) {
      test.skillValue ??= actor.system.skills[test.skillName].value;
    }
  }

  // Add Actor information
  foundry.utils.mergeObject(test, {
    actor: actor,
    bdDamageSum: 0,
  }, { inplace: true })

  return TestDialog.wait(test, { useTargets: true });
}


/**
 * INLINE CONDITIONS
 * 
 * @Condition[status]{label}
 * @Condition[status|overlay|on]{label}
 * @Condition[status|off]{label}
 * @Condition[status|on]{label}
 */
const InlineConditionPattern = /@Condition\[(.+?)\](?:\{(.+?)\}){0,1}/g;

function InlineConditionEnricher(match, options) {
  const parts = match[1].split('|');
  let label = match[2];
  const status = parts.shift();

  // Decode each of the parameters
  const dataset = { status };
  for (const elem of parts) {
    const [key, value] = elem.split("=");
    dataset[key] = value ?? true;
  }

  // Create the base anchor
  const anchor = foundry.applications.ux.TextEditor.createAnchor({
    //attrs: null, 
    dataset,
    name: label ?? _loc(`torgeternity.statusEffects.${status}`),
    classes: ['torg-inline-condition'],
    icon: dataset.off ? "fa-solid fa-circle-minus" : "fa-solid fa-circle-plus"
  });
  // Append a button to copy the link to chat (only when in Journal)
  if (!options.rollData && game.user.isGM) {
    const icon = document.createElement("i");
    icon.classList.add('icon', 'fa-solid', 'fa-comment', 'toChat');
    icon.dataset.original = match[0];
    anchor.append(icon);
  }
  return anchor;
}

/**
 * The click handler to trigger the Test Dialog when the button is clicked.
 * @param {Event} event 
 */
async function _onClickInlineCondition(event) {
  const target = event.target.closest('a.torg-inline-condition');
  // Firstly check for clicking on the "post to chat" button
  if (event.target.dataset.original) {
    return ChatMessage.implementation.create({ content: event.target.dataset.original })
  }

  const data = { ...target.dataset };
  sanitizeNumbers(data);

  const options = {};
  if (Object.hasOwn(data, "off")) options.active = false;
  else if (!Object.hasOwn(data, "toggle")) options.active = true;
  if (Object.hasOwn(data, "overlay")) options.overlay = true;
  const status = data.status;

  // Special case of stymied/vulnerable stacking
  const actors = getActors();
  if (!actors) return ui.notifications.info('torgeternity.notifications.noTokenNorActor', { localize: true });
  for (const actor of actors) {
    if (status === 'stymied' && options.active) {
      if (actor.hasStatusEffect('stymied')) {
        actor.setVeryStymied(actor.uuid);
        continue;
      } else if (actor.hasStatusEffect('veryStymied'))
        continue;
    } else if (status === 'vulnerable' && options.active) {
      if (actor.hasStatusEffect('vulnerable')) {
        actor.setVeryVulnerable(actor.uuid);
        continue;
      } else if (actor.hasStatusEffect('veryVulnerable'))
        continue;
    }
    console.log(`Setting '${actor.name}' = '${status}'`);
    let eff = await actor.toggleStatusEffect(status, options);
    if (data.duration) {
      // toggleStatusEffect only accepts 'active' and 'overlay' properties
      eff.update({
        duration: { value: data.duration, units: 'rounds', expiry: 'turnEnd' }
      })
    }
  }
}

/**
 * BUFF/DEBUFF specific attribute/skills
 */

const InlineBuffPattern = /@Buff\[(.+?)\](?:\{(.+?)\}){0,1}/g;

function InlineBuffEnricher(match, options) {
  const parts = match[1].split('|');
  let label = match[2];
  const dataset = {};

  function check(from, modifier, obj, type) {
    // Firstly check for property name
    if (Object.hasOwn(obj, from)) {
      dataset[`${type}${from}`] = modifier;
      return true;
    }
    // Now check for localized name
    for (const [key, value] of Object.entries(obj)) {
      const local = _loc(value);
      if (local === from) {
        dataset[`${type}${key}`] = modifier;
        return true;
      }
    }
    return false;
  }

  // Decode each of the parameters
  let found;
  for (const elem of parts) {
    const [key, value] = elem.split("=");
    if (value === undefined) {
      dataset[key] = true;
      continue;
    }
    if (check(key, value, CONFIG.torgeternity.attributeTypes, 'attribute') ||
      check(key, value, CONFIG.torgeternity.skills, 'skill'))
      found = true;
    else
      dataset[key] = value ?? true;
  }

  if (!found) {
    console.warn(`Unrecognised @Buff key: ${match[1]}`)
    return match[0];
  }

  function createLabel() {
    const parts = [];
    for (const [k, v] of Object.entries(dataset)) {
      if (k.startsWith('skill'))
        parts.push(guessLabel(k.slice(5)) + ` (${v})`);
      else if (k.startsWith('attribute'))
        parts.push(guessLabel(k.slice(9)) + ` (${v})`);
    }
    return parts.join(', ');
  }

  // Create the base anchor
  const anchor = foundry.applications.ux.TextEditor.createAnchor({
    dataset,
    name: label ?? createLabel(),
    classes: ['torg-inline-buff'],
    icon: "fa-solid fa-bolt-lightning"
  });
  // Append a button to copy the link to chat (only when in Journal)
  if (!options.rollData && game.user.isGM) {
    const icon = document.createElement("i");
    icon.classList.add('icon', 'fa-solid', 'fa-comment', 'toChat');
    icon.dataset.original = match[0];
    anchor.append(icon);
  }
  return anchor;
}

/**
 * The click handler to trigger the Test Dialog when the button is clicked.
 * @param {Event} event 
 */
async function _onClickInlineBuff(event) {
  const target = event.target.closest('a.torg-inline-buff');
  // Firstly check for clicking on the "post to chat" button
  if (event.target.dataset.original) {
    return ChatMessage.implementation.create({ content: event.target.dataset.original })
  }

  // Convert dataset into a set of active effect rules
  const effectdata = {
    name: target.text || 'FromBuff',
    img: 'icons/svg/aura.svg',
    //disabled: false,
    //transfer: false,  // Placed directly on Actor, so not transferred
    system: {
      changes: []
    }
  };

  function getType(v) {
    if (v.startsWith('-') || v.startsWith('+'))
      return 'add';
    else
      return 'override';
  }
  for (const [key, value] of Object.entries({ ...target.dataset })) {
    if (key.startsWith('skill'))
      effectdata.system.changes.push({
        key: `system.skills.${key.slice(5)}.adds`,
        type: getType(value),
        value: value
      });
    else if (key.startsWith('attribute'))
      effectdata.system.changes.push({
        key: `system.attributes.${key.slice(9)}.value`,
        type: getType(value),
        value: value
      });
    else if (key === 'duration') {
      if (!effectdata.duration) effectdata.duration = {}
      effectdata.duration.value = value;
      effectdata.duration.units ??= 'rounds';
      effectdata.duration.expiry ??= 'turnEnd';
    } else
      foundry.utils.setProperty(effectdata, key, value);
  }
  sanitizeNumbers(effectdata);

  // Add an effect to each actor
  const actors = getActors();
  if (!actors) return ui.notifications.info('torgeternity.notifications.noTokenNorActor', { localize: true });
  for (const actor of actors) {
    actor.createEmbeddedDocuments('ActiveEffect', [effectdata]);
  }
}

/**
 * @Damage[shock=x,damage=y]
 */

const InlineDamagePattern = /@Damage\[(.+?)\](?:\{(.+?)\}){0,1}/g;

function InlineDamageEnricher(match, options) {
  let label = match[2];
  const dataset = {};
  const parts = match[1].split('|');
  for (const elem of match[1].split('|')) {
    const [key, value] = elem.split("=");
    // Convert localized field into internal name
    if (key === 'shock' || key === _loc('torgeternity.sheetLabels.shock'))
      dataset.shock = value;
    else if (key === 'wounds' || key === _loc('torgeternity.sheetLabels.wounds'))
      dataset.wounds = value;
    else if (key === 'damage' || key === _loc('torgeternity.chatText.damage'))
      dataset.damage = value;
    else if (key === 'traits') {
      dataset.traits = value;
    }
    else
      dataset[key] = value ?? true;
  }

  const hasDamage = Object.hasOwn(dataset, 'damage');
  const hasSpecific = Object.hasOwn(dataset, 'shock') || Object.hasOwn(dataset, 'wounds');
  if (hasDamage === hasSpecific) {
    console.warn(`@Damage must have either 'damage=x' OR at least one of 'shock=x', 'wounds=x'`, match[0]);
    return match[0];
  }

  function createLabel() {
    let label = ''
    if (dataset.damage) {
      label += `${dataset.damage} ${_loc('torgeternity.chatText.damage')}`;
      if (dataset.traits) {
        const traits = [];
        for (const trait of dataset.traits.split(',')) {
          const loc = `torgeternity.traits.${trait}`;
          traits.push(game.i18n.has(loc) ? _loc(loc) : trait)
        }
        label += (` [${traits.join(',')}]`);
      }
    } else {
      if (dataset.shock) label += `${dataset.shock} ${_loc('torgeternity.sheetLabels.shock')}`
      if (dataset.shock && dataset.wounds) label += ', ';
      if (dataset.wounds) label += `${dataset.wounds} ${_loc('torgeternity.sheetLabels.wounds')}`
    }
    return label;
  }

  // Create the base anchor
  const anchor = foundry.applications.ux.TextEditor.createAnchor({
    dataset,
    name: label ?? createLabel(),
    classes: ['torg-inline-damage'],
    icon: (dataset.shock < 0 || dataset.wounds < 0) ? "fa-solid fa-heart" : "fa-solid fa-heart-crack"
  });

  // Append a button to copy the link to chat (only when in Journal)
  if (!options.rollData && game.user.isGM) {
    const icon = document.createElement("i");
    icon.classList.add('icon', 'fa-solid', 'fa-comment', 'toChat');
    icon.dataset.original = match[0];
    anchor.append(icon);
  }
  return anchor;
}


async function _onClickInlineDamage(event) {
  const target = event.target.closest('a.torg-inline-damage');
  const dataset = event.target.dataset;
  sanitizeNumbers(dataset);

  // Firstly check for clicking on the "post to chat" button
  if (event.target.dataset.original) {
    return ChatMessage.implementation.create({ content: event.target.dataset.original })
  }

  // Firstly check for clicking on the "post to chat" button
  const actors = getActors();
  if (!actors) return ui.notifications.info('torgeternity.notifications.noTokenNorActor', { localize: true });

  let chatOutput = `<h2>${dataset.label ?? _loc('torgeternity.chatText.check.result.damage')}</h2> `;
  if (dataset.damage) {
    chatOutput += `<p> ${_loc('torgeternity.chatText.baseDamage')} ${dataset.damage}`;
    if (dataset.ap) {
      chatOutput += `, ${_loc('torgeternity.gear.ap')} ${dataset.ap}`
    }
    chatOutput += `</p>`;
  }
  chatOutput += `<p> ${_loc('torgeternity.macros.fatigueMacroDealtDamage')}</p> <ul>`;
  for (const actor of actors) {
    let toughness = actor.system.defenses.toughness -
      (dataset.ignoreArmor ? actor.system.defenses.armor : (Math.min(dataset.ap ?? 0, actor.system.defenses.armor)));

    // for damage, need to adjust for AP and armour?
    const attackTraits = dataset.traits?.split(',');
    const defenseTraits = actor.defenseTraits;
    const damage = dataset.damage ?
      torgDamage(dataset.damage, toughness, { attackTraits, defenseTraits }) :
      torgDamageModifiers({
        shocks: (dataset.shock && Number(dataset.shock)) ?? 0,
        wounds: (dataset.wounds && Number(dataset.wounds)) ?? 0
      }, { attackTraits, defenseTraits });
    const wasKO = actor.hasStatusEffect('unconscious');
    const applyResult = actor.applyDamages(damage.shocks, damage.wounds, { nonLethal: attackTraits?.includes('nonLethal') });

    // Chat Message

    chatOutput += `<li>${actor.name}: `;
    const chatParts = [];
    chatParts.push(damage.label);
    if (applyResult.shockExceeded || applyResult.woundsExceeded) {
      if (wasKO)
        chatParts.push(`${_loc('torgeternity.macros.fatigueMacroCharAlreadyKO')}`);
      else
        chatParts.push(`<br><strong>${actor.name}${_loc('torgeternity.macros.fatigueMacroCharKO')}</strong>`);
    }
    chatOutput += chatParts.join(', ') + '</li>';
  }
  chatOutput += '</ul>';
  return ChatMessage.implementation.create({ content: chatOutput });
}

/**
 * COMMON INITIALISATION
 */
const enrichers = [
  {
    pattern: InlineCheckPattern,
    enricher: InlineCheckEnricher,
    id: 'torg-inline-check',
    onRender: (html) => html.addEventListener('click', _onClickInlineCheck),
  },
  {
    pattern: InlineConditionPattern,
    enricher: InlineConditionEnricher,
    id: 'torg-inline-condition',
    onRender: (html) => html.addEventListener('click', _onClickInlineCondition),
  },
  {
    pattern: InlineBuffPattern,
    enricher: InlineBuffEnricher,
    id: 'torg-inline-buff',
    onRender: (html) => html.addEventListener('click', _onClickInlineBuff),
  },
  {
    pattern: InlineDamagePattern,
    enricher: InlineDamageEnricher,
    id: 'torg-inline-damage',
    onRender: (html) => html.addEventListener('click', _onClickInlineDamage),
  },
];

export default function InitEnrichers() {
  CONFIG.TextEditor.enrichers.push(...enrichers);
}

function getActors() {
  if (!canvas.ready || canvas.tokens.controlled.length === 0)
    return game.user.character ? [game.user.character] : [];
  else
    return canvas.tokens.controlled.filter(token => token.isOwner).map(token => token.actor);
}