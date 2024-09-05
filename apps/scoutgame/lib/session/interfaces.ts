import type { Scout } from '@charmverse/core/prisma-client';
import type { SessionData } from '@connect-shared/lib/session/config';
import type { IronSession } from 'iron-session';
import type { headers } from 'next/headers';

export type LoggedInUser = Pick<Scout, 'id' | 'displayName' | 'username' | 'avatar' | 'builder'>;

export { SessionData };

export type RequestContext = {
  session: IronSession<SessionData>;
  headers: ReturnType<typeof headers>;
};
