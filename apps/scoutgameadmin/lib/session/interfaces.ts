import type { IronSession } from 'iron-session';
import type { headers } from 'next/headers';

export type SessionData = {
  adminId?: string;
};

export type RequestContext = {
  session: IronSession<SessionData>;
  headers: ReturnType<typeof headers>;
};
