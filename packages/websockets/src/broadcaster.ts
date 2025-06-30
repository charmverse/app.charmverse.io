import { prisma } from '@charmverse/core/prisma-client';
import { getClient as getPostgresClient } from '@packages/adapters/postgres/postgresClient';
import { redisClient } from '@packages/adapters/redis/redisClient';
import { isDevEnv, isTestEnv } from '@packages/config/constants';
import { log } from '@packages/core/log';
import { SpaceMembershipRequiredError } from '@packages/lib/permissions/errors';
import { createAdapter as createPostgresAdapter } from '@socket.io/postgres-adapter';
import { createAdapter as createRedisAdapter } from '@socket.io/redis-adapter';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';

import { authOnConnect } from './authentication';
import { config } from './config';
import { docRooms } from './documentEvents/docRooms';
import { DocumentEventHandler } from './documentEvents/documentEvents';
import type { AbstractWebsocketBroadcaster, ServerMessage } from './interfaces';
import { SpaceEventHandler } from './spaceEvents';

export class WebsocketBroadcaster implements AbstractWebsocketBroadcaster {
  sockets: Record<string, Socket> = {};

  // Server will be set after the first request
  private io: Server = new Server(config);

  // Only called once in the app lifecycle once the server is initialised
  async bindServer(io: Server): Promise<void> {
    this.io = io;
    // add support for passing messages in production
    if (redisClient) {
      const pubClient = redisClient;
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      log.debug('Connecting to Redis for socket.io');
      // @ts-ignore
      io.adapter(createRedisAdapter(pubClient, subClient));
      log.debug('Enabled Redis adapter for socket.io');
    }
    // add support for passing messages in local dev
    else if (typeof process.env.DATABASE_URL === 'string' && (isDevEnv || isTestEnv)) {
      const pool = getPostgresClient(process.env.DATABASE_URL);
      io.adapter(createPostgresAdapter(pool));
      log.debug('Enabled Postgres adapter for socket.io');
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
      new SpaceEventHandler(this, socket, docRooms).init();

      // Socket-io clientsCount includes namespaces, but these are actually sent under the same web socket
      // so we only need to keep track of the number of clients connected to the root namespace
      log.debug('[ws] Web socket connected', {
        socketId: socket.id,
        // clientCount: io.engine.clientsCount,
        clientCount: io.of('/').sockets.size
      });

      socket.on('disconnect', () => {
        log.debug('[ws] Web socket disconnected', {
          socketId: socket.id,
          clientCount: io.of('/').sockets.size
        });
      });
    });

    io.of('/ceditor')
      .use(authOnConnect)
      .on('connect', (socket) => {
        log.debug('[ws] Web socket namespace /editor connected', { socketId: socket.id, userId: socket.data.user.id });
        new DocumentEventHandler(this, socket, docRooms).init();
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

  close() {
    log.info('[server] Closing Websocket server...');
    this.io.close();
  }
}
