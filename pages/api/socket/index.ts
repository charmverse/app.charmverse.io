import { sealData } from 'iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import type { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';

import { websocketsHost } from 'config/constants';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { authSecret } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import type { SealedUserId, SocketAuthReponse } from 'lib/websockets/interfaces';
import { relay } from 'lib/websockets/relay';

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

  if (!websocketsHost) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    relay.bindServer(io);
    log.info('Web socket server instantiated');
  }
  else {
    log.info('Web socket server is running on a different host');
  }

  res.send({ authToken: sealedUserId });
}

export default withSessionRoute(handler);
