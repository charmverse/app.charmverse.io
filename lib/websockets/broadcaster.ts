import type { Block } from '@prisma/client';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';

import { prisma } from 'db';
import type { PageMeta } from 'lib/pages';

const WebsocketEvents = ['block_updated', 'page_meta_updated'] as const;

export type WebsocketEvent = typeof WebsocketEvents[number]

export type Resource = { id: string }
export type ResourceWithSpaceId = Resource & { spaceId: string }

// List of event payloads
export type BlockUpdate = Partial<Block> & ResourceWithSpaceId

export type PageMetaUpdate = Partial<PageMeta> & ResourceWithSpaceId

export type Updates = {
  block_updated: BlockUpdate;
  page_meta_updated: PageMetaUpdate;
}

export type WebsocketPayload<T extends WebsocketEvent = WebsocketEvent> = Updates[T]

export type WebsocketMessage<T extends WebsocketEvent = WebsocketEvent> = {
  type: T;
  payload: WebsocketPayload<T>;
}

export type WebsocketSubscriber = {
  userId: string;
}

export class WebsocketBroadcaster {

  private userSockets: Record<string, Socket> = {

  };

  private async setUserSocket ({ userId, socket }: { userId: string, socket: Socket }) {
    this.userSockets[userId] = socket;
  }

  private async getUserSocket (userId: string): Promise<Socket | undefined> {
    return this.userSockets[userId];
  }

  private identifier = Math.random();

  // Server will be set after the first request
  private io: Server = new Server();

  // Only called once in the app lifecycle once the server is initialised
  bindServer (io: Server): void {
    this.io = io;

    // Function for debugging amount of connections
    // setInterval(() => {
    //   this.io.sockets.allSockets().then(sockets => {
    //     // eslint-disable-next-line no-console
    //     console.log('Connected socket amount', sockets.size);
    //   });

    // }, 1000);

  }

  broadcastToAll (message: WebsocketMessage): void {
    this.io.emit('message', message);
  }

  broadcast (message: WebsocketMessage, roomId: string): void {
    this.io.to(roomId).emit('message', message);
  }

  async registerSubscriber ({ userId, socket, roomId }: { userId: string, socket: Socket, roomId: string }): Promise<void> {

    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        userId
      }
    });

    await this.setUserSocket({ userId, socket });

    spaceRoles.forEach(role => {
      socket.join(role.spaceId);
    });

  }

  async removeSubscriber (userId: string): Promise<void> {
    const userSocket = await this.getUserSocket(userId);
    userSocket?.rooms.forEach(room => {
      userSocket.leave(room);
    });
  }

}

