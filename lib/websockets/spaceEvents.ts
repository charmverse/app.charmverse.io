import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

import { authSecret } from 'lib/session/config';
import type { ClientMessage, SealedUserId } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';

import { docRooms } from './documentEvents/documentEvents';

export class SpaceEventHandler {
  socketEvent = 'message';

  userId: string | null = null;

  constructor(private socket: Socket) {
    this.socket = socket;
  }

  init() {
    this.socket.on(this.socketEvent, async (message) => {
      try {
        await this.onMessage(message);
      } catch (error) {
        log.error('Error handling space socket message', error);
      }
    });

    this.socket.emit(this.socketEvent, { type: 'welcome' });
  }

  async onMessage(message: ClientMessage) {
    if (message.type === 'subscribe') {
      try {
        const { userId: decryptedUserId } = await unsealData<SealedUserId>(message.payload.authToken, {
          password: authSecret
        });
        if (typeof decryptedUserId === 'string') {
          this.userId = decryptedUserId;
          relay.registerWorkspaceSubscriber({
            userId: decryptedUserId,
            socket: this.socket,
            roomId: message.payload.spaceId
          });
        }
      } catch (error) {
        log.error('Error subscribing user to space events', { error });
        this.sendError('Error subscribing to space');
      }
    } else if (message.type === 'page_deleted' && this.userId) {
      try {
        const pageWithSpaceId = await prisma.page.findUniqueOrThrow({
          where: {
            id: message.payload.id
          },
          select: {
            spaceId: true,
            parentId: true
          }
        });

        const parentId = pageWithSpaceId.parentId;

        const documentRoom = parentId ? docRooms.get(parentId) : null;

        if (documentRoom) {
          const participant = Array.from(documentRoom.participants.values()).find(
            // Send the userId using payload for now
            (_participant) => _participant.getSessionMeta().userId === this.userId
          );
          if (participant) {
            // Go through all the node of the document and find the position of the node of type: 'page'
            let position: null | number = null;

            documentRoom.node.forEach((node, nodePos) => {
              if (node.type.name === 'page' && node.attrs.id === message.payload.id) {
                position = nodePos;
                return false;
              }
            });

            if (position !== null) {
              // TODO: Should this be handleDiff or handleMessage?
              await participant.handleDiff(
                {
                  type: 'diff',
                  ds: [
                    {
                      stepType: 'replace',
                      from: position,
                      to: position + 1
                    }
                  ],
                  // TODO: How to get the correct c, s and v values?
                  doc: documentRoom.doc.content,
                  c: participant.messages.client,
                  s: participant.messages.server,
                  // TODO: How to get the correct rid and cid values?
                  rid: 0,
                  // cid: -1 indicates that use the cid from the
                  cid: -1,
                  v: documentRoom.doc.version
                },
                false
              );
            }
          } else if (documentRoom.participants.size !== 0) {
            // Handle the case where the user is not present in the document but other users are present
          } else {
            // Handle the case when the document is not open by any user
          }
        } else {
          // Handle the case when the document is not open by any user
        }
      } catch (error) {
        const errorMessage = 'Error deleting a page after link was deleted from its parent page';
        log.error(errorMessage, {
          error,
          pageId: message.payload.id,
          userId: this.userId
        });
        this.sendError(errorMessage);
      }
    }
  }

  sendError(message: string) {
    this.socket.emit(this.socketEvent, { type: 'error', message });
  }
}
