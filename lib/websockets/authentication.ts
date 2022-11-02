import { IncomingMessage, ServerResponse } from 'http';

import { getIronSession } from 'iron-session';
import type { Socket } from 'socket.io';

import { prisma } from 'db';
import { ironOptions } from 'lib/session/config';

export type SocketUser = { id: string };
export type AuthenticatedSocket = { user: SocketUser };

export async function authOnConnect (socket: Socket, next: (err?: Error) => void) {

  if (socket.handshake.query && typeof socket.handshake.query.token === 'string') {
    try {
      // @ts-ignore IncomingMessage doesn't require an argument
      const req = new IncomingMessage();
      req.headers = socket.handshake.headers;
      const res = new ServerResponse(req);
      const session = await getIronSession(req, res, ironOptions);
      // const { userId } = await unsealData<SealedUserId>(socket.handshake.query.token, {
      //   password: AUTH_SECRET
      // });
      if (!session.user) {
        throw new Error('User not logged in');
      }

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: session.user.id }
      });

      socket.data.user = user;
      next();
    }
    catch (error) {
      next(error as Error);
    }
  }
  else {
    next(new Error('Authentication error'));
  }
}
