/**
 *
 * @param event
 * @param owner
 */
export async function onManageActiveEffect(event, button, owner) {
  event.preventDefault();
  const a = event.target;
  const li = button.closest('li');
  if (!li) return;
  // not fromUuidSync, in case we are editing a compendium document
  const effect = await fromUuid(li.dataset.effectUuid);

  switch (button.dataset.control) {
    case 'create':
      return owner.createEmbeddedDocuments('ActiveEffect', [
        {
          name: 'New Effect',
          icon: 'icons/svg/aura.svg',
          origin: owner.uuid,
          duration: {
            rounds: li.dataset.effectType === 'temporary' ? 1 : undefined,
            expiry: 'turnEnd'
          },
          disabled: li.dataset.effectType === 'inactive',
        },
      ]);
    case 'edit':
      if (!effect) return;
      return effect.sheet.render({ force: true });
    case 'delete':
      if (!effect) return;
      return effect.delete();
    case 'toggle':
      if (!effect) return;
      return effect.update({ disabled: !effect.disabled });
  }
}

/**
 *
 * @param effects
 */
export function prepareActiveEffectCategories(effects) {
  // Define effect header categories
  const categories = {
    temporary: {
      type: 'temporary',
      label: `${game.i18n.localize('torgeternity.sheetLabels.tempEffects')}`,
      effects: [],
    },
    passive: {
      type: 'passive',
      label: `${game.i18n.localize('torgeternity.sheetLabels.passiveEffects')}`,
      effects: [],
    },
    inactive: {
      type: 'inactive',
      label: `${game.i18n.localize('torgeternity.sheetLabels.inactiveEffects')}`,
      effects: [],
    },
  };

  // Iterate over active effects, classifying them into categories
  for (const e of effects) {
    // e._getSourceName(); // Trigger a lookup for the source name
    //if ( e.isSuppressed ) categories.suppressed.effects.push(e);
    if (e.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }
  return categories;
}
