import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';

const notionClientId = process.env.NOTION_OAUTH_CLIENT_ID as string;
const notionUrl = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${notionClientId}&response_type=code`;

const handler = nc({
  onError,
  onNoMatch
});

handler.get((req, res) => {

  if (!req.query.redirect) {
    return res.status(400).json('Missing redirect');
  }
  if (!req.query.spaceId) {
    return res.status(400).json('Missing space id');
  }
  const state = encodeURIComponent(JSON.stringify({
    account: req.query.account,
    redirect: req.query.redirect,
    spaceId: req.query.spaceId
  }));
  const oauthUrl = `${notionUrl}&state=${state}&redirect_uri=${encodeURIComponent(`${req.headers.origin}/api/notion/callback` as string)}`;
  res.send({ redirectUrl: oauthUrl });
});

export default handler;
