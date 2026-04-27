export class TorgSetField extends foundry.data.fields.SetField {

  constructor(element, options = {}, context = {}) {
    super(element, options, context);
    this.choices = options.choices;
  }

  choices;

  _toInput(config) {
    if (!this.choices || !(this.element instanceof foundry.data.fields.StringField)) return super._toInput(config);

    const tagelement = TorgHTMLStringTagsElement.create(config);
    tagelement.setAttribute('datalist', JSON.stringify(this.choices));
    return tagelement;
  }
}


class TorgHTMLStringTagsElement extends foundry.applications.elements.HTMLStringTagsElement {

  static tagName = `torg-${foundry.applications.elements.HTMLStringTagsElement.tagName}`;

  _buildElements() {
    const elements = super._buildElements();

    // Build a local datalist
    const data = this.getAttribute('datalist');
    if (data) {
      const choices = JSON.parse(data);
      const datalist = document.createElement('datalist');
      datalist.id = foundry.utils.randomID();
      for (const [key, lang] of Object.entries(choices)) {
        datalist.appendChild(new Option(_loc(lang), key))
      }
      this._primaryInput.appendChild(datalist);
      this._primaryInput.setAttribute('list', datalist.id);
    }
    return elements;
  }
}

window.customElements.define(TorgHTMLStringTagsElement.tagName, TorgHTMLStringTagsElement);
