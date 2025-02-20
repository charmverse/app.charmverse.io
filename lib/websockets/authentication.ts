import { IncomingMessage, ServerResponse } from 'http';

import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getIronOptions } from '@packages/nextjs/session/getIronOptions';
import { authSecret } from '@root/config/constants';
import { ActionNotPermittedError } from '@root/lib/middleware';
import type { SessionData } from '@root/lib/session/config';
import type { SealedUserId } from '@root/lib/websockets/interfaces';
import { getIronSession, unsealData } from 'iron-session';
import type { Socket } from 'socket.io';

export type SocketUser = { id: string; avatar: string | null; name: string };
export type AuthenticatedSocketData = { user: SocketUser };

type AuthenticatedSocket = Socket<any, any, any, AuthenticatedSocketData>;

export async function authOnConnect(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  try {
    let userId: string;
    if (socket.handshake.auth.authToken) {
      ({ userId } = await getUserIdFromToken(socket.handshake.auth.authToken));
    } else {
      // use cookie session locally /// TODO: maybe delete this?
      const session = await getSessionFromSocket(socket);
      if (!session.user) {
        throw new ActionNotPermittedError('Please log in');
      }
      userId = session.user.id;
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId }
    });

    // add data to the individual client socket
    socket.data.user = {
      id: user.id,
      avatar: user.avatar,
      name: user.username
    };

    next();
  } catch (error) {
    log.warn('Unable to authorize socket', error);
    next(error as Error);
  }
}

async function getUserIdFromToken(authToken: string) {
  if (!authSecret) {
    throw new Error('Auth secret not defined');
  }
  return unsealData<SealedUserId>(authToken, {
    password: authSecret
  });
}

function getSessionFromSocket(socket: Socket) {
  // @ts-ignore IncomingMessage doesn't require an argument
  const req = new IncomingMessage();
  req.headers = socket.handshake.headers;
  const res = new ServerResponse(req);
  return getIronSession<SessionData>(req, res, getIronOptions());
}
