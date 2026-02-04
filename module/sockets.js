import { renderSkillChat } from './torgchecks.js';

export default function activateSocketListeners() {
  game.socket.on(`system.${game.system.id}`, async (socketMessage) => {

    switch (socketMessage.request) {
      case 'replaceTestCard':
        if (!game.user.isActiveGM) return;
        game.messages.get(socketMessage.messageId).delete();
        return renderSkillChat(socketMessage.test);
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