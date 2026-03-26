const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export default class EffectsPanel extends HandlebarsApplicationMixin(ApplicationV2) {

  static panel;
  #actor;

  constructor(options) {
    super(options);
    EffectsPanel.panel = this;
    // Only one occurrence of this class is possible,
    // so only register hooks when first constructed.
    Hooks.on('controlToken', EffectsPanel.onControlToken);
    Hooks.on('refreshToken', EffectsPanel.onRefreshToken);
  }

  static DEFAULT_OPTIONS = {
    id: 'effects-panel',
    classes: ['torgeternity', 'effects-panel', 'themed', 'theme-dark'],
    window: {
      contentClasses: ['standard-form'],
      frame: false,
      minimizable: false,
      resizable: false,
      positioned: false,
    }
  }

  static PARTS = {
    body: { template: 'systems/torgeternity/templates/effects-panel.hbs', scrollable: [""] },
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    for (const button of this.element.querySelectorAll('[data-action]'))
      button.addEventListener('pointerdown', EffectsPanel.#onClick.bind(this));
  }

  _insertElement(element) {
    const existing = document.getElementById(element.id);
    if (existing) return existing.replaceWith(element);

    // Place below torg controls if present
    if (ui.torgControlButtons)
      ui.torgControlButtons.element.append(element);
    else
      ui.sidebar.element.prepend(element);
  }
  /**
   * @inheritDoc 
   */
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

    const showAll = !game.settings.get('torgeternity', 'effectsPanelOnlyTemporary');
    context.temporaryEffects = [];
    context.disabledEffects = [];
    if (showAll) context.activeEffects = [];
    // Ignore events which are suppressed programatically.
    if (actor)
      for (const effect of actor.allApplicableEffects()) {
        if (effect.isSuppressed) continue;
        if (effect.isTemporary) {
          if (effect.disabled)
            context.disabledEffects.push(effect)
          else
            context.temporaryEffects.push(effect)
        } else if (showAll) {
          // get active() => !this.disabled && !this.isSuppressed;
          if (effect.disabled)
            context.disabledEffects.push(effect)
          else
            context.activeEffects.push(effect)
        }
      }
    //context.bar1 = ()

    return context;
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
    if (event.shiftKey) {
      if (effect.parent instanceof foundry.documents.Actor)
        await effect.delete();
    } else
      await effect.update({ disabled: !effect.disabled });
    // Render with the new list of effects
    this.render();
  }

  static onControlToken(token, controlled) {
    if (controlled)
      EffectsPanel.panel.render({ force: true });
    else if (EffectsPanel.panel.rendered)
      EffectsPanel.panel.render();
  }

  static onRefreshToken(token, flags) {
    if (EffectsPanel.panel.#actor === token.actor && flags.refreshEffects && EffectsPanel.panel.rendered)
      EffectsPanel.panel.render({ force: true });
  }
}