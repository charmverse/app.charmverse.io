import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import log from 'lib/log';
import type { ClientMessage, SealedUserId } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';

const authSecret = process.env.AUTH_SECRET as string;

export class SpaceEventHandler {

  socketEvent = 'message';

  constructor (private socket: Socket) {
    this.listen();
    this.open();
  }

  open () {
    this.socket.emit(this.socketEvent, { type: 'welcome' });
  }

  private listen () {
    this.socket.on(this.socketEvent, async message => {
      try {
        await this.onMessage(message);
      }
      catch (error) {
        log.error('Error handling workspace socket message', error);
      }
    });
  }

  async onMessage (message: ClientMessage) {
    if (message.type === 'subscribe') {
      try {
        const { userId: decryptedUserId } = await unsealData<SealedUserId>(message.payload.authToken, {
          password: authSecret
        });
        if (typeof decryptedUserId === 'string') {
          relay.registerWorkspaceSubscriber({
            userId: decryptedUserId,
            socket: this.socket,
            roomId: message.payload.spaceId
          });
        }
      }
      catch (err) {
        this.sendError('Unable to register user');
      }
    }
  }

  sendError (message: string) {
    this.socket.emit(this.socketEvent, { type: 'error', message });
  }

}
