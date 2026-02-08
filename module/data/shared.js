import { getTorgValue } from '../torgchecks.js';
import { torgeternity } from '../config.js';

/**
 *
 * @param {boolean} unskilledUse Can the skill be used unskilled?
 * @param {string} baseAttribute the attribute the skill is based on
 * @param {string} groupName the group the skill belongs to
 * @returns {object} Schema for a skill
 */
export function makeSkillFields(unskilledUse, baseAttribute, groupName) {
  const fields = foundry.data.fields;
  return new fields.SchemaField({
    adds: new fields.NumberField({ initial: 0, integer: true }),  // if null then untrained/not allowed
    baseAttribute: new fields.StringField({ initial: baseAttribute, choices: torgeternity.attributeTypes }),
    groupName: new fields.StringField({ initial: groupName }),
    isFav: new fields.BooleanField({ initial: false }),
    isThreatSkill: new fields.BooleanField({ initial: false }),
    defenseOnly: new fields.BooleanField({ initial: false }),
    unskilledUse: new fields.BooleanField({ initial: unskilledUse }),
  });
}

export function makeAxiomsField() {
  const fields = foundry.data.fields;

  return new fields.SchemaField({
    magic: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
    social: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
    spirit: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
    tech: new fields.NumberField({ initial: 0, integer: true, nullable: false }),
  })
}

export function migrateCosm(cosm) {
  if (!cosm)
    return 'none'
  else if (Object.hasOwn(CONFIG.torgeternity.cosmTypes, cosm))
    return cosm;
  else if (Object.hasOwn(CONFIG.torgeternity.cosmTypeFromLabel, cosm))
    return CONFIG.torgeternity.cosmTypeFromLabel[cosm];

  console.log(`Invalid Cosm: '${cosm}'`);
  return 'none';
}

export function calcPriceValue(price) {
  const found = price?.replaceAll(',', '').match(/^(\d+)(\D*)$/);
  if (!found) return null;
  let fullprice = Number(found[1]);
  if (found[2]) {
    const units = found[2];
    if (units === CONFIG.torgeternity.magnitudeLabels.billions) {
      fullprice *= 1000000000;
    } else if (units === CONFIG.torgeternity.magnitudeLabels.millions) {
      fullprice *= 1000000;
    } else if (units === CONFIG.torgeternity.magnitudeLabels.thousands) {
      fullprice *= 1000;
    } else {
      // Unknown suffix, so don't generate a value
      fullprice = null;
    }
  }
  return fullprice ? getTorgValue(fullprice) : null;
}