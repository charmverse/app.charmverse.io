import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const notionClientId = process.env.NOTION_OAUTH_CLIENT_ID as string;
const notionUrl = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${notionClientId}&response_type=code`;

export interface NotionState {
  redirect: string;
}

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).get(login);

async function login(req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.redirect) {
    return res.status(400).json('Missing redirect');
  }
  const state: NotionState = {
    redirect: encodeURIComponent(req.query.redirect as string)
  };
  const proto = req.headers['x-forwarded-proto'] || (req.connection as any)?.encrypted ? 'https' : 'http';
  const redirectUri = `${proto}://${req.headers.host}/api/notion/callback`;
  const oauthUrl = `${notionUrl}&state=${JSON.stringify(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(oauthUrl);
}

export default withSessionRoute(handler);
