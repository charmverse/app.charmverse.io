import type { Block } from '@prisma/client';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';

import { prisma } from 'db';
import type { PageMeta } from 'lib/pages';

export type WebsocketEvent = 'block_updated' | 'page_meta_updated'

export type Resource = { id: string }
// List of event payloads
export type BlockUpdate = Partial<Block> & Resource

export type PageMetaUpdate = Partial<PageMeta> & Resource

export type Updates = {
  block_updated: BlockUpdate;
  page_meta_updated: PageMetaUpdate;
}

export type WebsocketPayload<T extends WebsocketEvent = WebsocketEvent> = Updates[T]

export type WebsocketMessage<T extends WebsocketEvent = WebsocketEvent> = {
  type: T;
  spaceId: string;
  payload: WebsocketPayload<T>;
}

export type WebsocketSubscriber = {
  userId: string;
}

export type Broadcaster = {

  /**
   * Utility to bind the http server to this instance.
   */
  bindServer(server: any): void;

  broadcast(message: WebsocketMessage): void;

  registerSubscriber(registration: { userId: string, socket: Socket }): Promise<void>;

  removeSubscriber(userId: string): Promise<void>;

}

export class WebsocketBroadcaster implements Broadcaster {

  private workspaceRooms: Record<string, Socket> = {

  };

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

  broadcast (message: WebsocketMessage<'block_updated'>): void {
    this.io.to(message.spaceId).emit('message', message);
  }

  async registerSubscriber ({ userId, socket }: { userId: string, socket: Socket }): Promise<void> {

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

// Export the singleton instance
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var relay: Broadcaster | undefined;
}

export const relay = global.relay ?? new WebsocketBroadcaster();

global.relay = relay;
