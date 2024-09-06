import type { SessionData } from '@connect-shared/lib/session/config';
import type { IronSession } from 'iron-session';
import type { headers } from 'next/headers';

export { SessionData };

export type RequestContext = {
  session: IronSession<SessionData>;
  headers: ReturnType<typeof headers>;
};
