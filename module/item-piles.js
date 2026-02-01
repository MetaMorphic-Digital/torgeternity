export default async function setupItemPiles() {
  const baseConfig =
  {
    "CURRENCIES": [],
    "SECONDARY_CURRENCIES": [],
    "CURRENCY_DECIMAL_DIGITS": 1.0,
    "ITEM_FILTERS": [
      {
        "path": "type",
        "filters": "customAttack,customSkill,enhancement,miracle,perk,psionicpower,race,specialability,specialability-rollable,spell,vehicleAddOn"
      }
    ],
    "ITEM_SIMILARITIES": [
      "name",
      "type"
    ],
    "UNSTACKABLE_ITEM_TYPES": [
      "armor",
      "eternityshard",
      "firearm",
      "heavyweapon",
      "meleeweapon",
      "missileweapon",
      "shield",
      "vehicle"
    ],
    "ACTOR_CLASS_TYPE": "stormknight",
    "ITEM_CLASS_LOOT_TYPE": "gear",
    "ITEM_CLASS_WEAPON_TYPE": "meleeweapon",
    "ITEM_CLASS_EQUIPMENT_TYPE": "gear",
    "ITEM_QUANTITY_ATTRIBUTE": "system.quantity",
    "ITEM_PRICE_ATTRIBUTE": "system.price.dollars",
    "QUANTITY_FOR_PRICE_ATTRIBUTE": "flags.item-piles.system.quantityForPrice"
  }

  // Set up Currencies (based on currencies defined in any compendium packs)
  function addCurrency(currency) {
    const primary = (currency.system.cosm === 'coreEarth' || currency.system.cosm === 'other');
    const data = ({
      id: currency.id,
      "type": "item",
      "name": currency.name,
      "img": currency.img,
      "abbreviation": `{#} ${currency.name}`,
      "primary": primary,
      "secondary": !primary,
      "exchangeRate": 1,
      data: { uuid: currency.uuid },
    });
    baseConfig.CURRENCIES.push(data);
  }
  for (const item of game.items.filter(it => it.type === 'currency'))
    addCurrency(item);

  for (const pack of game.packs.filter(p => p.metadata.type === 'Item' && !p.metadata.name.startsWith('item-piles')))
    for (const packEntry of pack.index.filter(it => it.type === 'currency')) {
      addCurrency(await pack.getDocument(packEntry._id));
    }

  await game.itempiles.API.addSystemIntegration(baseConfig);
}