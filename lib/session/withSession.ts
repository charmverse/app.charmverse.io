import type { IronSessionData } from 'iron-session';
import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next';
import type { GetServerSidePropsContext, GetServerSidePropsResult, NextApiHandler } from 'next';

import { getIronOptions } from './getIronOptions';

// Code Source: the Readme at https://github.com/vvo/iron-session

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, getIronOptions);
}

type SessionContext = GetServerSidePropsContext & {
  session?: IronSessionData;
};

// Theses types are compatible with InferGetStaticPropsType https://nextjs.org/docs/basic-features/data-fetching#typescript-use-getstaticprops
export function withSessionSsr<P extends { [key: string]: unknown } = { [key: string]: unknown }>(
  handler: (context: SessionContext) => GetServerSidePropsResult<P> | Promise<GetServerSidePropsResult<P>>
) {
  return withIronSessionSsr(handler, getIronOptions);
}
