import { User } from '@prisma/client';

declare module 'iron-session' {
  interface IronSessionData {
    user: User;
  }
}

export const ironOptions = {
  cookieName: 'charm.sessionId',
  password: process.env.AUTH_SECRET as string,
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production'
  }
};
