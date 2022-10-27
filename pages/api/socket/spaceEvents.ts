import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import type { ClientMessage as ClientWorkspaceMessage, SealedUserId } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';

const authSecret = process.env.AUTH_SECRET as string;
const socketEvent = 'message';

export async function registerSpaceEvents (socket: Socket) {

  socket.emit(socketEvent, { type: 'welcome' });

  socket.on(socketEvent, async (message: ClientWorkspaceMessage) => {
    if (message.type === 'subscribe') {
      try {
        const { userId: decryptedUserId } = await unsealData<SealedUserId>(message.payload.authToken, {
          password: authSecret
          // ttl: safeUserIdTtl
        });
        if (typeof decryptedUserId === 'string') {
          relay.registerWorkspaceSubscriber({
            userId: decryptedUserId,
            socket,
            roomId: message.payload.spaceId
          });
        }
      }
      catch (err) {
        socket.emit('error', 'Unable to register user');
      }
    }
  });
}
