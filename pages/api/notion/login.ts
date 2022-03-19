import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';

const notionClientId = process.env.NOTION_OAUTH_CLIENT_ID as string;
const notionUrl = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${notionClientId}&response_type=code`;

const handler = nc({
  onError,
  onNoMatch
});

handler.use(requireUser).get(login);

async function login (req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.redirect) {
    return res.status(400).json('Missing redirect');
  }
  if (!req.query.spaceId) {
    return res.status(400).json('Missing space id');
  }
  const state = encodeURIComponent(JSON.stringify({
    account: req.query.account,
    redirect: req.query.redirect,
    spaceId: req.query.spaceId,
    userId: req.session.user.id
  }));
  const oauthUrl = `${notionUrl}&state=${state}&redirect_uri=${encodeURIComponent(req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/notion/callback` : 'https://app.charmverse.io/api/notion/callback')}`;
  res.send({ redirectUrl: oauthUrl });
}

export default withSessionRoute(handler);
