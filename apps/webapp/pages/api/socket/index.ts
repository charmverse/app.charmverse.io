import { log } from '@charmverse/core/log';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { authSecret } from '@packages/lib/session/authSecret';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { SealedUserId, SocketAuthResponse } from '@packages/websockets/interfaces';
import { relay } from '@packages/websockets/relay';
import { sealData } from 'iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import type { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(socketHandler);

// Initialise socket and bind user session to the socket

type NextApiReponseWithSocketServer<T = any> = NextApiResponse<T> & {
  socket: {
    server: Partial<ServerOptions> & {
      io?: Server;
    };
  };
};

// set a ttl that allows sockets to reuse in the same session
const sevenDaysInSeconds = 7 * 24 * 60 * 60;

// Subscribe user to messages
async function socketHandler(req: NextApiRequest, res: NextApiReponseWithSocketServer<SocketAuthResponse>) {
  // capture value of userId on connect
  const userId = req.session.user.id;

  const sealedUserId = await sealData(
    {
      userId
    } as SealedUserId,
    {
      password: authSecret,
      ttl: sevenDaysInSeconds
    }
  );

  // It means that socket server was already initialised
  if (res.socket?.server?.io) {
    res.send({ authToken: sealedUserId });
    return;
  }
  const io = new Server(res.socket.server, {
    // increase the amount of data that can be sent to the server
    maxHttpBufferSize: 1e7 // set from 1e6 (1MB) to 1e7 (10Mb)
  });
  res.socket.server.io = io;
  relay.bindServer(io);
  log.info('Web socket server instantiated');

  res.send({ authToken: sealedUserId });
}

export default withSessionRoute(handler);
