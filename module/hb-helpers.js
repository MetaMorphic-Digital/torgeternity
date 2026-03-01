export function initHandlebarsHelpers() {
  Handlebars.registerHelper({ TorgRadioBoxesNumber })
  Handlebars.registerHelper({ TorgHidden })
  Handlebars.registerHelper({ TorgDisconnected })
  Handlebars.registerHelper({ TorgIsSvg })
}

function TorgRadioBoxesNumber(name, choices, options) {
  const checked = options.hash.checked ?? null;
  const isNumber = typeof checked === 'number';
  const isChecked = checked !== null;
  const localize = options.hash.localize || false;
  let html = "";
  for (let [key, label] of Object.entries(choices)) {
    if (localize) label = game.i18n.localize(label);
    const element = document.createElement("label");
    element.classList.add("checkbox");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = key;
    if (isChecked) input.defaultChecked = (checked == key);
    if (isNumber) input.dataset.dtype = "Number";
    if (options.hash.tooltip) element.dataset.tooltip = key;
    element.append(input, label);
    html += element.outerHTML;
  }
  return new Handlebars.SafeString(html);
}

function TorgHidden(value) {
  return value ? "hidden" : "";
}

function TorgDisconnected(doc) {
  return doc?.isDisconnected ? "disconnected" : "";
}

function TorgIsSvg(value) {
  return value.endsWith('.svg') ? 'svg' : '';
}