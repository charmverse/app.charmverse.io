import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import type { ClientMessage as ClientPageMessage } from 'components/common/CharmEditor/components/fiduswriter/ws';
import log from 'lib/log';
import type { SealedUserId } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';

const authSecret = process.env.AUTH_SECRET as string;
const socketEvent = 'page_message';

export async function registerPageEvents (socket: Socket) {

  socket.emit(socketEvent, { type: 'welcome' });

  socket.on(socketEvent, async (message: ClientPageMessage) => {

    log.debug('page message message', message);

    try {
      switch (message.type) {

        case 'subscribe': {
          const { userId: decryptedUserId } = await unsealData<SealedUserId>(message.authToken, {
            password: authSecret
            // ttl: safeUserIdTtl
          });

          if (typeof decryptedUserId === 'string') {
            relay.registerPageSubscriber({
              userId: decryptedUserId,
              socket,
              roomId: message.roomId
            });
          }
          break;
        }

        case 'unsubscribe':
          socket.leave(message.roomId);
          break;

        default:
          log.debug('Unhandled socket message type', message);
      }
    }
    catch (err) {
      socket.emit('error', 'Unable to register user');
    }
  });
}
