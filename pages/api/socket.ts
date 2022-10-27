import { sealData, unsealData } from 'iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import type { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';

import type { SocketMessage } from 'components/common/CharmEditor/components/fiduswriter/ws';
import log from 'lib/log';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { SocketAuthReponse, ClientMessage } from 'lib/websockets/interfaces';
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

type SealedUserId = {
  userId: string;
}

const authSecret = process.env.AUTH_SECRET as string;
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

  // Define actions inside
  io.on('connect', (socket) => {

    socket.emit('message', { type: 'welcome' });
    socket.emit('page_message', { type: 'welcome' });

    socket.on('message', async (message: ClientMessage) => {

      try {
        switch (message.type) {
          case 'subscribe': {
            const { userId: decryptedUserId } = await unsealData<SealedUserId>(message.payload.authToken, {
              password: authSecret,
              ttl: safeUserIdTtl
            });
            if (typeof decryptedUserId === 'string') {
              relay.registerWorkspaceSubscriber({
                userId: decryptedUserId,
                socket,
                roomId: message.payload.spaceId
              });
            }
            break;
          }

          default:
            log.debug('Unhandled socket message type', message);
        }
      }
      catch (err) {
        socket.emit('error', 'Unable to register user');
      }
    });

    socket.on('page_message', async (message: SocketMessage) => {
      log.debug('page message message', message);
      try {
        switch (message.type) {

          case 'subscribe': {
            const { userId: decryptedUserId } = await unsealData<SealedUserId>(message.authToken, {
              password: authSecret,
              ttl: safeUserIdTtl
            });
            if (typeof decryptedUserId === 'string') {
              relay.registerPageSubscriber({
                userId: decryptedUserId,
                socket,
                roomId: message.roomId
              });
            }
            break;
          }

          case 'unsubscribe':
            socket.leave(message.roomId);
            break;

          default:
            log.debug('Unhandled socket message type', message);
        }
      }
      catch (err) {
        socket.emit('error', 'Unable to register user');
      }
    });

  });

  res.socket.server.io = io;

  relay.bindServer(io);

  res.send({ authToken: sealedUserId });
}

export default withSessionRoute(handler);
