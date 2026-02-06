/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 *
 * @returns {Promise}
 */
export const preloadTemplates = async function () {
  // Define template paths to load
  const templatePaths = [
    // ACTOR--stormknights
    'systems/torgeternity/templates/actors/stormknight/attributes.hbs',
    'systems/torgeternity/templates/actors/stormknight/skills.hbs',
    'systems/torgeternity/templates/actors/stormknight/header.hbs',
    'systems/torgeternity/templates/actors/stormknight/perks-details.hbs',
    'systems/torgeternity/templates/actors/stormknight/defense.hbs',
    'systems/torgeternity/templates/actors/stormknight/eternityshards-list.hbs',
    'systems/torgeternity/templates/actors/stormknight/weapons-list.hbs',
    'systems/torgeternity/templates/actors/stormknight/others.hbs',
    'systems/torgeternity/templates/actors/stormknight/perks-list.hbs',
    'systems/torgeternity/templates/actors/stormknight/gear.hbs',
    'systems/torgeternity/templates/actors/stormknight/powers.hbs',
    'systems/torgeternity/templates/actors/stormknight/xp.hbs',
    'systems/torgeternity/templates/actors/currency-choice.hbs',

    // ACTOR--threats
    'systems/torgeternity/templates/actors/threat/main.hbs',
    'systems/torgeternity/templates/actors/threat/header.hbs',
    'systems/torgeternity/templates/actors/threat/stat-tab.hbs',
    'systems/torgeternity/templates/actors/threat/abilities.hbs',
    'systems/torgeternity/templates/actors/threat/gears.hbs',
    'systems/torgeternity/templates/actors/threat/powers.hbs',
    'systems/torgeternity/templates/actors/threat/sidebar.hbs',
    'systems/torgeternity/templates/actors/threat/background.hbs',

    // ACTOR - vehicles
    'systems/torgeternity/templates/actors/vehicle/main.hbs',
    'systems/torgeternity/templates/actors/vehicle/header.hbs',
    'systems/torgeternity/templates/actors/vehicle/stats.hbs',
    'systems/torgeternity/templates/actors/vehicle/gear.hbs',
    'systems/torgeternity/templates/actors/vehicle/background.hbs',

    // Test Dialogs
    'systems/torgeternity/templates/testDialogs/attack-options.hbs',
    'systems/torgeternity/templates/testDialogs/bonus-selector.hbs',
    'systems/torgeternity/templates/testDialogs/difficulty-selector.hbs',
    'systems/torgeternity/templates/testDialogs/favored.hbs',
    'systems/torgeternity/templates/testDialogs/fixed-modifiers.hbs',
    'systems/torgeternity/templates/testDialogs/modifiers-table.hbs',
    'systems/torgeternity/templates/testDialogs/movement-penalty-selector.hbs',
    'systems/torgeternity/templates/testDialogs/multi-action-selector.hbs',
    'systems/torgeternity/templates/testDialogs/multi-target-selector.hbs',
    'systems/torgeternity/templates/testDialogs/target-options.hbs',

    // active effect part:
    'systems/torgeternity/templates/parts/active-effects.hbs',

    // chatCards
    'systems/torgeternity/templates/chat/activeDefense-card.hbs',
    'systems/torgeternity/templates/chat/armor-card.hbs',
    'systems/torgeternity/templates/chat/attack-card.hbs',
    'systems/torgeternity/templates/chat/bonus-card.hbs',
    'systems/torgeternity/templates/chat/currency-card.hbs',
    'systems/torgeternity/templates/chat/enhancement-card.hbs',
    'systems/torgeternity/templates/chat/effects-subcard.hbs',
    'systems/torgeternity/templates/chat/eternityshard-card.hbs',
    'systems/torgeternity/templates/chat/gear-card.hbs',
    'systems/torgeternity/templates/chat/implant-card.hbs',
    'systems/torgeternity/templates/chat/meleeweapon-card.hbs',
    'systems/torgeternity/templates/chat/miracle-card.hbs',
    'systems/torgeternity/templates/chat/perk-card.hbs',
    'systems/torgeternity/templates/chat/possibility-card.hbs',
    'systems/torgeternity/templates/chat/power-card.hbs',
    'systems/torgeternity/templates/chat/psionicpower-card.hbs',
    'systems/torgeternity/templates/chat/shield-card.hbs',
    'systems/torgeternity/templates/chat/skill-card.hbs',
    'systems/torgeternity/templates/chat/specialability-card.hbs',
    'systems/torgeternity/templates/chat/skill-error-card.hbs',
    'systems/torgeternity/templates/chat/spell-card.hbs',
    'systems/torgeternity/templates/chat/vehicle-card.hbs',
    // Powers
    'systems/torgeternity/templates/items/powers-sheet.hbs',
    // Items
    'systems/torgeternity/templates/items/ammunition-field.hbs',
    `systems/torgeternity/templates/items/ammunition-sheet.hbs`,
    `systems/torgeternity/templates/items/armor-sheet.hbs`,
    `systems/torgeternity/templates/items/currency-sheet.hbs`,
    `systems/torgeternity/templates/items/customAttack-sheet.hbs`,
    `systems/torgeternity/templates/items/customSkill-sheet.hbs`,
    `systems/torgeternity/templates/items/enhancement-sheet.hbs`,
    `systems/torgeternity/templates/items/eternityshard-sheet.hbs`,
    `systems/torgeternity/templates/items/firearm-sheet.hbs`,
    `systems/torgeternity/templates/items/gear-sheet.hbs`,
    `systems/torgeternity/templates/items/heavyweapon-sheet.hbs`,
    `systems/torgeternity/templates/items/implant-sheet.hbs`,
    `systems/torgeternity/templates/items/meleeweapon-sheet.hbs`,
    `systems/torgeternity/templates/items/powers-sheet.hbs`,
    `systems/torgeternity/templates/items/missileweapon-sheet.hbs`,
    `systems/torgeternity/templates/items/perk-sheet.hbs`,
    `systems/torgeternity/templates/items/perk-enhancements-sheet.hbs`,
    `systems/torgeternity/templates/items/perk-limitations-sheet.hbs`,
    `systems/torgeternity/templates/items/powers-sheet.hbs`,
    `systems/torgeternity/templates/items/race-sheet.hbs`,
    `systems/torgeternity/templates/items/shield-sheet.hbs`,
    `systems/torgeternity/templates/items/specialability-sheet.hbs`,
    `systems/torgeternity/templates/items/specialability-rollable-sheet.hbs`,
    `systems/torgeternity/templates/items/powers-sheet.hbs`,
    `systems/torgeternity/templates/items/vehicle-sheet.hbs`,
    `systems/torgeternity/templates/items/vehicleAddOn-sheet.hbs`,

    // Cards
    "systems/torgeternity/templates/cards/torgeternityCard.hbs",
    "systems/torgeternity/templates/cards/torgeternityPlayerHand.hbs",
    "systems/torgeternity/templates/cards/torgeternityPlayerHand_lifelike.hbs",
    "systems/torgeternity/templates/cards/settingMenu.hbs",
    "systems/torgeternity/templates/cards/torgeternityDeck-details.hbs",
    "systems/torgeternity/templates/cards/torgeternityDeck-cards.hbs",
    "systems/torgeternity/templates/cards/torgeternityPile.hbs",

  ];

  // Load the template parts
  return foundry.applications.handlebars.loadTemplates(templatePaths);
};
