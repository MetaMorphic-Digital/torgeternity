import { torgeternity } from '../../config.js';

/**
 * ChatMessage Implementation for Torg Eternity
 * renders the chatMessage from data every time the HTML is rendered
 */
export class ChatMessageTorg extends ChatMessage {

  async renderHTML(options) {
    const html = await super.renderHTML(options);
    if (this.isContentVisible &&
      this.flags?.torgeternity?.template &&
      this.flags?.torgeternity?.test) {

      const templateData = { ...this.flags.torgeternity.test }; // make copy
      templateData.isOpen = game.settings.get('torgeternity', 'showCheckDetails') ? "open" : "";
      templateData.ownsActor = fromUuidSync(templateData.actor)?.isOwner;
      if (templateData.target) templateData.ownsTarget = game.actors.get(templateData.target?.id)?.isOwner;

      const renderedTemplate = await foundry.applications.handlebars.renderTemplate(this.flags.torgeternity.template, templateData);
      html.querySelector('.message-content').innerHTML = await foundry.applications.ux.TextEditor.enrichHTML(renderedTemplate, { secrets: this.isOwner });
    }
    return html;
  }
}