import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';

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

async function login (req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.redirect) {
    return res.status(400).json('Missing redirect');
  }
  const state: NotionState = {
    redirect: encodeURIComponent(req.query.redirect as string)
  };
  const redirectUri = req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/notion/callback` : 'https://app.charmverse.io/api/notion/callback';
  const oauthUrl = `${notionUrl}&state=${JSON.stringify(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(oauthUrl);
}

export default withSessionRoute(handler);
