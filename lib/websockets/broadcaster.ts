import { createAdapter } from '@socket.io/redis-adapter';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';

import { redisClient } from 'adapters/redis/redisClient';
import { prisma } from 'db';
import { SpaceMembershipRequiredError } from 'lib/permissions/errors';

import type { WebsocketEvent, WebsocketMessage } from './interfaces';

export class WebsocketBroadcaster {

  private userSockets: Record<string, Socket> = {

  };

  private async setUserSocket ({ userId, socket }: { userId: string, socket: Socket }) {
    this.userSockets[userId] = socket;
  }

  private async getUserSocket (userId: string): Promise<Socket | undefined> {
    return this.userSockets[userId];
  }

  // Server will be set after the first request
  private io: Server = new Server();

  // Only called once in the app lifecycle once the server is initialised
  async bindServer (io: Server): Promise<void> {

    this.io = io;

    if (redisClient) {
      const pubClient = redisClient;
      const subClient = pubClient.duplicate();

      await Promise.all([
        pubClient.connect(),
        subClient.connect()
      ]);

      io.adapter(createAdapter(pubClient, subClient));
    }

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

  broadcast<T extends WebsocketEvent> (message: WebsocketMessage<T>, roomId: string): void {
    this.io.to(roomId).emit('message', message);
  }

  /**
   * Subscribe a user to all events for themselves and a specific room
   * Unsubscribes user from all other rooms
   */
  async registerSubscriber ({ userId, socket, roomId }: { userId: string, socket: Socket, roomId: string }): Promise<void> {

    const spaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId,
        spaceId: roomId
      }
    });

    if (!spaceRole) {
      socket.send(new SpaceMembershipRequiredError(`User ${userId} does not have access to ${roomId}`));
      return;
    }

    const existingSocket = await this.getUserSocket(userId);

    // Handle undefined and existing socket
    if (!existingSocket) {
      await this.setUserSocket({ userId, socket });

    }
    else if (existingSocket.id !== socket.id) {
      // existingSocket.disconnect();
      await this.setUserSocket({ userId, socket });
    }

    Object.keys(socket.rooms).forEach(room => {
      if (room !== userId && room !== roomId) {
        socket.leave(room);
      }
    });

    socket.join([roomId, userId]);

  }

}

