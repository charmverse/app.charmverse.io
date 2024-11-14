import type { SessionData } from '@packages/scoutgame/session/interfaces';
import type { IronSession } from 'iron-session';
import type { headers } from 'next/headers';

export type RequestContext = {
  session: IronSession<SessionData>;
  headers: ReturnType<typeof headers>;
};
