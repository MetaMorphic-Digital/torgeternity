export function initHideCompendium() {
  Hooks.on('renderCompendiumDirectory', (tabDirectory, html, user, options) => {
    if (!game.settings.get('torgeternity', 'hideForeignCompendium')) return;
    if (!options.isFirstRender) return;

    let langKeys;
    switch (game.settings.get('core', 'language')) {
      case 'en':
      case 'es':
        langKeys = ['(fr)', '(de)'];
        break;
      case 'de':
        langKeys = ['(fr)', '(en)'];
        break;
      case 'fr':
        langKeys = ['(en)', '(de)'];
        break;
      default:
        langKeys = ['(en)', '(de)', '(fr)'];
    }

    for (const element of html.querySelectorAll('li.compendium>a.compendium-name')) {
      for (const key of langKeys) {
        if (element.innerText.includes(key)) {
          element.parentElement.hidden = true;
        }
      }
    }

    // Any folder with at least one hidden entry will be hidden if it doesn't
    // still have some visible entries.
    for (const list of html.querySelectorAll('li.folder')) {
      // Maybe has a compendium which is not hidden?
      if (list.querySelector('li.compendium:not([hidden])')) {
        continue;
      }
      // Does it have at least one hidden folder?
      if (!list.querySelector('li.compendium[hidden]')) {
        continue;
      }
      list.hidden = true;
    }
  });
}