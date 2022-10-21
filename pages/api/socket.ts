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

type NextApiReponseWithSocketServer = NextApiResponse & {
  socket: {
    server: Partial<ServerOptions> & {
      io?: Server;
    };
  };
}

// Subscribe user to messages
function socketHandler (req: NextApiRequest, res: NextApiReponseWithSocketServer) {

  // It means that socket server was already initialised
  if (res.socket?.server?.io) {

    res.end();
    return;
  }

  const io = new Server(res.socket.server);

  // Define actions inside
  io.on('connect', (socket) => {

    socket.on('message', (message: WebsocketMessage) => {
      socket.emit('message', 'Hello from the server!');

      if (message.type === 'subscribe') {
        relay.registerSubscriber({
          userId: req.session.user.id,
          socket,
          roomId: (message as WebsocketMessage<'subscribe'>).payload.spaceId
        });
      }
    });
  });

  res.socket.server.io = io;

  relay.bindServer(io);

  res.end();
}

export default withSessionRoute(handler);
