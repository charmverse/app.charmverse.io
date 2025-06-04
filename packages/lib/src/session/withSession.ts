import { getSession } from '@packages/nextjs/session/getSession';
import type { IronSession } from 'iron-session';
import { getIronSession } from 'iron-session';
import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiHandler,
  NextApiRequest,
  NextApiResponse
} from 'next';

import type { SessionData } from './config';

// For API requests
export function withSessionRoute(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    req.session = await getSession(req, res);
    return handler(req, res);
  };
}

type SSRContext = GetServerSidePropsContext & {
  session?: NextApiRequest['session'];
};
// For SSR requests
// Reference: https://github.com/vvo/iron-session/blob/v6/next/index.ts#L54
export function withSessionSsr<P extends { [key: string]: unknown } = { [key: string]: unknown }>(
  handler: (context: SSRContext) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
) {
  return async (context: SSRContext) => {
    context.req.session = await getSession(context.req, context.res);
    return handler(context);
  };
}
