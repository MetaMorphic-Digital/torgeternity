const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api
import TorgeternityActor from './documents/actor/torgeternityActor.js';

export default class EffectsPanel extends HandlebarsApplicationMixin(ApplicationV2) {

  static panel;
  #actor;

  constructor(options) {
    super(options);
    EffectsPanel.panel = this;
    // Only one occurrence of this class is possible,
    // so only register hooks when first constructed.
    Hooks.on('controlToken', EffectsPanel.onControlToken);

    new ResizeObserver((entries) => {
      if (!EffectsPanel.panel.rendered) return;
      for (const entry of entries) {
        const rect = entry.target.getBoundingClientRect();
        EffectsPanel.panel.setPosition({ left: rect.left - 64, top: rect.top + 10 });
      }
    }).observe(foundry.ui.sidebar.element);
  }

  static DEFAULT_OPTIONS = {
    classes: ['torgeternity', 'effects-panel', 'themed', 'theme-dark'],
    window: {
      contentClasses: ['standard-form'],
      frame: false,
      minimizable: false,
      resizable: false,
      positioned: true,
    }
  }

  static PARTS = {
    body: { template: 'systems/torgeternity/templates/effects-panel.hbs', scrollable: [""] },
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const sidebar = foundry.ui.sidebar.element;
    const rect = sidebar.getBoundingClientRect();
    this.setPosition({ left: rect.left - 64, top: rect.top + 10 })

    for (const button of this.element.querySelectorAll('[data-action]'))
      button.addEventListener('pointerdown', EffectsPanel.#onClick.bind(this));
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const token = canvas.ready && (canvas.tokens.controlled.length === 1) ? canvas.tokens.controlled[0] : null;
    const actor = token ? token.actor : game.user.character;
    if (this.#actor && this.#actor !== actor) {
      delete this.#actor.apps[this.id];
    }
    if (actor && this.#actor !== actor) {
      actor.apps[this.id] = this;
      this.#actor = actor;
    }

    context.effects = game.settings.get('torgeternity', 'effectsPanelOnlyTemporary') ? actor?.temporaryEffects : actor?.appliedEffects;
    return context;
  }

  _onClose(options) {
    if (this.#actor) this.#actor.apps[this.id] = this;
    super._onClose(options);
  }

  static #onClick(event) {
    const target = event.target;
    const actionButton = target.closest("[data-action]");
    switch (event.button) {
      case 0: // LEFT
        return this.onLeftClick(actionButton, event);

      case 2: // RIGHT
        return this.onRightClick(actionButton, event);
    }
  }

  async onLeftClick(button, event) {
    const effect = fromUuidSync(button.dataset.uuid);
    if (effect) effect.sheet.render({ force: true });
  }

  async onRightClick(button, event) {
    const effect = fromUuidSync(button.dataset.uuid);
    if (!effect || !effect.isEmbedded) return;
    if (effect.parent instanceof TorgeternityActor)
      await effect.delete();
    else
      await effect.update({ disabled: true });
    // Render with the new list of effects
    this.render();
  }

  static onControlToken(token, controlled) {
    if (controlled)
      EffectsPanel.panel.render({ force: true });
    else if (EffectsPanel.panel.rendered)
      EffectsPanel.panel.render();
  }

  static onCollapseSidebar(collapsed) {
    if (EffectsPanel.panel.rendered) EffectsPanel.panel.render();
  }
}