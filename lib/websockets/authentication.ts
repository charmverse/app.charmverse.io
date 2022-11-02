import { IncomingMessage, ServerResponse } from 'http';

import { getIronSession } from 'iron-session';
import type { Socket } from 'socket.io';

import { prisma } from 'db';
import { ironOptions } from 'lib/session/config';

export type SocketUser = { id: string, name: string };
export type AuthenticatedSocket = { user: SocketUser };

export async function authOnConnect (socket: Socket, next: (err?: Error) => void) {

  try {
    const session = await getSessionFromCookies(socket);
    if (!session.user) {
      throw new Error('User not logged in');
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.user.id }
    });

    // add data to the individual client socket
    socket.data.user = user;

    next();
  }
  catch (error) {
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
