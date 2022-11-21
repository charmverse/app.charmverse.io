import { sealData } from 'iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import type { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { authSecret } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { authOnConnect } from 'lib/websockets/authentication';
import { DocumentEventHandler } from 'lib/websockets/documentEvents';
import type { SealedUserId, SocketAuthReponse } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';
import { SpaceEventHandler } from 'lib/websockets/spaceEvents';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(socketHandler);

// Initialise socket and bind user session to the socket

type NextApiReponseWithSocketServer<T = any> = NextApiResponse<T> & {
  socket: {
    server: Partial<ServerOptions> & {
      io?: Server;
    };
  };
}

const safeUserIdTtl = 15;

// Subscribe user to messages
async function socketHandler (req: NextApiRequest, res: NextApiReponseWithSocketServer<SocketAuthReponse>) {

  // capture value of userId on connect
  const userId = req.session.user.id;

  const sealedUserId = await sealData({
    userId
  } as SealedUserId, {
    password: authSecret,
    ttl: safeUserIdTtl
  });

  // It means that socket server was already initialised
  if (res.socket?.server?.io) {

    res.send({ authToken: sealedUserId });
    return;
  }

  const io = new Server(res.socket.server);

  // Define listeners
  io
    .on('connect', (socket) => {
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
      new DocumentEventHandler(socket).init();
    });

  res.socket.server.io = io;

  relay.bindServer(io);

  res.send({ authToken: sealedUserId });
}

export default withSessionRoute(handler);
