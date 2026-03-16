import { renderSkillChat } from './torgchecks.js';

export default function activateSocketListeners() {
  game.socket.on(`system.${game.system.id}`, async (socketMessage) => {

    switch (socketMessage.request) {
      case 'replaceTestCard':
        if (!game.user.isActiveGM) return;
        return renderSkillChat(socketMessage.test, game.messages.get(socketMessage.messageId));
        break;

      case 'swapCards':
        if (!game.user.isActiveGM) return;
        {
          console.log('GM: swapCards');
          const stack1 = game.cards.get(socketMessage.stack1);
          const stack2 = game.cards.get(socketMessage.stack2);
          const card1 = stack1.cards.get(socketMessage.card1);
          const card2 = stack2.cards.get(socketMessage.card2);
          if (!card1 || !card2) return;
          card1.pass(stack2);
          card2.pass(stack1);
        }
        break;

      case 'updateChatMessage':
        if (!game.user.isActiveGM) return;
        {
          const chatMessage = game.messages.get(socketMessage.messageId);
          if (chatMessage) return chatMessage.update(socketMessage.updates);
          break;
        }

      case 'updateChatMessageTarget':
        // TODO: future improvement to only update the corresponding Target in the targetAll array
        if (!game.user.isActiveGM) return;
        {
          const chatMessage = game.messages.get(socketMessage.messageId);
          if (chatMessage) {
            const target = socketMessage.dummyTarget ? chatMessage.test.targetAll[0] :
              chatMessage.test.targetAll.find(target => target.uuid === socketMessage.targetUuid);
            if (target) {
              Object.assign(target, foundry.utils.expandObject(socketMessage.updates));
              return chatMessage.update({ 'flags.torgeternity.test.targetAll': test.targetAll });
            }
          }
          break;
        }
    }
  })
}