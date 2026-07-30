/**
 * ChatMessage Implementation for Torg Eternity
 * renders the chatMessage from data every time the HTML is rendered
 */
export class ChatMessageTorg extends ChatMessage {

  static migrateData(source, options) {
    if (source?.flags?.torgeternity?.test) {
      source.system = source.flags.torgeternity.test;
      delete source.flags.torgeternity.test;
    }
    return super.migrateData(source, options);
  }

  // An update of the message might make the message longer,
  // so we need to make sure that if the chat log is scrolled to the bottom
  // then the bottom message remains entirely visible.
  #debounceScrollDown = foundry.utils.debounce(this.#setScrollDown.bind(this), 100);
  #setScrollDown() {
    ui.chat.scrollBottom();
  }

  async renderHTML(options) {
    const html = await super.renderHTML(options);
    if (this.isContentVisible &&
      this.flags?.torgeternity?.template &&
      !foundry.utils.isEmpty(this.system)) {

      const context = { ...this.system }; // make copy
      context.isOpen = game.settings.get('torgeternity', 'showCheckDetails') ? "open" : "";
      context.ownsActor = fromUuidSync(context.actor)?.isOwner;
      for (const target of context.targets)
        if (!target.dummyTarget && fromUuidSync(target.uuid, { strict: false })?.isOwner) target.ownsTarget = true;

      const renderedTemplate = await foundry.applications.handlebars.renderTemplate(this.flags.torgeternity.template, context);
      html.querySelector('.message-content').innerHTML = await foundry.applications.ux.TextEditor.enrichHTML(renderedTemplate, { secrets: this.isOwner });
    }
    if (ui.chat.isAtBottom) this.#debounceScrollDown();
    return html;
  }
}