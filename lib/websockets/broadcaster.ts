import { createAdapter } from '@socket.io/redis-adapter';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';

import { redisClient } from 'adapters/redis/redisClient';
import { prisma } from 'db';
import log from 'lib/log';
import { SpaceMembershipRequiredError } from 'lib/permissions/errors';
import { authOnConnect } from 'lib/websockets/authentication';
import { DocumentEventHandler } from 'lib/websockets/documentEvents';
import { SpaceEventHandler } from 'lib/websockets/spaceEvents';

import type { ServerMessage } from './interfaces';

export class WebsocketBroadcaster {
  sockets: Record<string, Socket> = {};

  // Server will be set after the first request
  private io: Server = new Server();

  // Only called once in the app lifecycle once the server is initialised
  async bindServer(io: Server): Promise<void> {
    this.io = io;

    if (redisClient) {
      const pubClient = redisClient;
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      log.debug('Connecting to Redis for socket.io');
      io.adapter(createAdapter(pubClient, subClient));
    }

    // Function for debugging amount of connections
    // setInterval(() => {
    //   this.io.sockets.allSockets().then(sockets => {
    //     // eslint-disable-next-line no-console
    //     console.log('Connected socket amount', sockets.size);
    //   });
    // });
    // }, 1000);

    // Define listeners
    io.on('connect', (socket) => {
      new SpaceEventHandler(socket).init();

      // Socket-io clientsCount includes namespaces, but these are actually sent under the same web socket
      // so we only need to keep track of the number of clients connected to the root namespace
      log.debug('[ws] Web socket connected', {
        // clientCount: io.engine.clientsCount,
        clientCount: io.of('/').sockets.size
      });

      socket.on('disconnect', () => {
        log.debug('[ws] Web socket disconnected', {
          clientCount: io.of('/').sockets.size
        });
      });
    });

    io.of('/ceditor')
      .use(authOnConnect)
      .on('connect', (socket) => {
        log.debug('[ws] Web socket namepsace /editor connected');
        new DocumentEventHandler(socket).init();
      });
  }

  broadcastToAll(message: ServerMessage): void {
    this.io.emit('message', message);
  }

  broadcast(message: ServerMessage, roomId: string): void {
    this.io.to(roomId).emit('message', message);
  }

  leaveRoom(socket: Socket, roomId: string): void {
    socket.leave(roomId);
  }

  /**
   * Subscribe a user to all events for themselves and a specific room
   * Unsubscribes user from all other rooms
   */
  async registerWorkspaceSubscriber({ userId, socket, roomId }: { userId: string; socket: Socket; roomId: string }) {
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

    Object.keys(socket.rooms).forEach((room) => {
      socket.leave(room);
    });

    socket.join([roomId]);

    this.sockets[userId] = socket;
  }
}
