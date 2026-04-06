import { renderSkillChat } from './torgchecks.js';

export default function activateSocketListeners() {
  game.socket.on(`system.${game.system.id}`, async (socketMessage) => {

    switch (socketMessage.request) {
      case 'replaceTestCard':
        if (!game.user.isActiveGM) return;
        return renderSkillChat(socketMessage.test, game.messages.get(socketMessage.messageId));

      case 'swapCards':
        if (!game.user.isActiveGM) return;
        return ui.handsViewer.gmExchangeCards(socketMessage);

      case 'updateChatMessage':
        if (!game.user.isActiveGM) return;
        {
          const chatMessage = game.messages.get(socketMessage.messageId);
          if (chatMessage) return chatMessage.update(socketMessage.updates);
          break;
        }

      case 'updateChatMessageTarget':
        // TODO: future improvement to only update the corresponding Target in the targets array
        if (!game.user.isActiveGM) return;
        {
          const chatMessage = game.messages.get(socketMessage.messageId);
          if (chatMessage) {
            const target = socketMessage.dummyTarget ? chatMessage.test.targets[0] :
              chatMessage.test.targets.find(target => target.uuid === socketMessage.targetUuid);
            if (target) {
              Object.assign(target, foundry.utils.expandObject(socketMessage.updates));
              return chatMessage.update({ 'flags.torgeternity.test.targets': test.targets });
            }
          }
          break;
        }
    }
  })
}