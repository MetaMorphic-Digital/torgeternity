/**
 *
 */
export class torgeternityCards extends Cards {

  async drawDestiny() {
    if (this.type !== 'hand') {
      console.error('torgeternityCards.drawDestiny called for a deck that is not a HAND')
      return;
    }
    const destinyDeck = game.cards.get(game.settings.get('torgeternity', 'deckSetting').destinyDeck);
    if (!destinyDeck) return;
    if (destinyDeck.cards.size) {
      const [firstCardKey] = destinyDeck.cards.keys(); // need to grab a card to get toMessage access
      const card = destinyDeck.cards.get(firstCardKey);
      card.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: game.actors.get(this.flags.torgeternity.defaultHand) }),
        content: `<div class="card-draw flexrow"><span class="card-chat-tooltip">
        <img class="card-face" src="${destinyDeck.img}"/><span><img src="${destinyDeck.img}"></span></span>
        <h4 class="card-name">${_loc('torgeternity.chatText.drawsCard')} ${destinyDeck.name}.</h4></div>`
      });
    }
    return this.draw(destinyDeck, 1, { face: 1, ...game.torgeternity.cardChatOptions });
  }

  async drawCosm(cosmdeck) {
    if (this.type !== 'hand') {
      console.error('torgeternityCards.drawDestiny called for a deck that is not a HAND')
      return;
    }
    const cosmDeck = game.cards.get(cosmdeck);
    if (cosmDeck.cards.size) {
      const [firstCardKey] = cosmDeck.cards.keys(); // need to grab a card to get toMessage access
      const card = cosmDeck.cards.get(firstCardKey);
      card.toMessage({
        content: `<div class="card-draw flexrow"><span class="card-chat-tooltip"><img class="card-face" src="${cosmDeck.img
          }"/><span><img src="${cosmDeck.img
          }"></span></span><h4 class="card-name">${_loc(
            'torgeternity.chatText.drawsCard'
          )} ${cosmDeck.name}.</h4></div>`,
      });
    }
    return this.draw(cosmDeck, 1, { face: 1, ...game.torgeternity.cardChatOptions }).catch((err) => {
      ui.notifications.error(err.message);
      return this;
    });
  }
}
