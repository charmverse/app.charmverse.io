import { IncomingMessage, ServerResponse } from 'http';

import { getIronSession } from 'iron-session';
import type { Socket } from 'socket.io';

import { prisma } from 'db';
import { ActionNotPermittedError } from 'lib/middleware';
import { ironOptions } from 'lib/session/config';

export type SocketUser = { id: string, avatar: string | null, name: string };
export type AuthenticatedSocketData = { user: SocketUser };

type AuthenticatedSocket = Socket<any, any, any, AuthenticatedSocketData>;

export async function authOnConnect (socket: AuthenticatedSocket, next: (err?: Error) => void) {

  try {
    const session = await getSessionFromCookies(socket);
    if (!session.user) {
      throw new ActionNotPermittedError('User not logged in');
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id }
    });

    // add data to the individual client socket
    socket.data.user = {
      id: user.id,
      avatar: user.avatar,
      name: user.username
    };

    next();
  }
  catch (error) {
    log.warn('User is not authorized to connect to socket', error);
    next(error as Error);
  }
}

function getSessionFromCookies (socket: Socket) {
  // @ts-ignore IncomingMessage doesn't require an argument
  const req = new IncomingMessage();
  req.headers = socket.handshake.headers;
  const res = new ServerResponse(req);
  return getIronSession(req, res, ironOptions);
}
