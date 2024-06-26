import type { IronSession } from 'iron-session';
import type { ParameterizedContext } from 'koa';

import type { SessionData } from 'lib/session/config';

type Session = IronSession<SessionData>;

declare module 'koa' {
  interface Request {
    body: any;
    session: Session;
  }
}

export type RouterContext<RequestBody = any, ResponseBody = any> = ParameterizedContext & {
  request: Omit<Koa.Request, 'body'> & { body: RequestBody; session: Session };
  body: ResponseBody;
};
