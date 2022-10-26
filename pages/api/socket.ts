import { sealData, unsealData } from 'iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import type { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { WebsocketMessage } from 'lib/websockets/interfaces';
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

const authSecret = process.env.AUTH_SECRET as string;
const safeUserIdTtl = 15;

// Subscribe user to messages
async function socketHandler (req: NextApiRequest, res: NextApiReponseWithSocketServer<{ safeUserId: string }>) {

  // capture value of userId on connect
  const userId = req.session.user.id;

  const sealedUserId = await sealData({
    userId
  }, {
    password: authSecret,
    ttl: safeUserIdTtl
  });

  // It means that socket server was already initialised
  if (res.socket?.server?.io) {

    res.send({ safeUserId: sealedUserId });
    return;
  }

  const io = new Server(res.socket.server);

  // Define actions inside
  io.on('connect', (socket) => {

    socket.emit('message', 'Connection established');

    socket.on('message', async (message: WebsocketMessage<'subscribe'>) => {

      try {
        const decryptedUserId = (await unsealData<{ userId: string }>(message.payload.safeUserId, {
          password: authSecret,
          ttl: safeUserIdTtl
        }))?.userId;

        if (message.type === 'subscribe' && typeof decryptedUserId === 'string') {
          relay.registerSubscriber({
            userId: decryptedUserId,
            socket,
            roomId: (message).payload.spaceId
          });
        }

      }
      catch (err) {
        socket.emit('error', 'Unable to register user');
      }
    });
  });

  res.socket.server.io = io;

  relay.bindServer(io);

  res.send({ safeUserId: sealedUserId });
}

export default withSessionRoute(handler);
