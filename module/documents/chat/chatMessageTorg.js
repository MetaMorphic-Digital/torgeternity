/**
 * ChatMessage Implementation for Torg Eternity
 * renders the chatMessage from data every time the HTML is rendered
 */
export class ChatMessageTorg extends ChatMessage {

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
      this.flags?.torgeternity?.test) {

      const templateData = { ...this.flags.torgeternity.test }; // make copy
      templateData.isOpen = game.settings.get('torgeternity', 'showCheckDetails') ? "open" : "";
      templateData.ownsActor = fromUuidSync(templateData.actor)?.isOwner;
      for (const target of templateData.targetAll)
        target.ownsTarget = !target.dummyTarget && fromUuidSync(target.uuid, { strict: false })?.isOwner || false;

      const renderedTemplate = await foundry.applications.handlebars.renderTemplate(this.flags.torgeternity.template, templateData);
      html.querySelector('.message-content').innerHTML = await foundry.applications.ux.TextEditor.enrichHTML(renderedTemplate, { secrets: this.isOwner });
    }
    if (ui.chat.isAtBottom) this.#debounceScrollDown();
    return html;
  }
}