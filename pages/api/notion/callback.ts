import Cookies from 'cookies';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { Client } from '@notionhq/client';
import * as http from 'adapters/http';
import { TextContent } from 'models';
import { ListBlockChildrenParameters } from '@notionhq/client/build/src/api-endpoints';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {
  const tempAuthCode = req.query.code;
  if (req.query.error || !tempAuthCode) {
    console.log('Error or missing code from Notion OAuth. Response query:', req.query);
    res.redirect('/');
    return;
  }
  let state: {
    account: string,
    redirect: string
    spaceId: string
    userId: string
  } = {} as any;
  try {
    state = JSON.parse(decodeURIComponent(req.query.state as string));
  }
  catch (e) {
    console.error('Error parsing state notion callback', e);
    res.status(400).send('Invalid state');
    return;
  }
  const encodedToken = Buffer.from(`${process.env.NOTION_OAUTH_CLIENT_ID}:${process.env.NOTION_OAUTH_SECRET}`).toString('base64');

  const token = await http.POST<{access_token: string, owner: {user: {id: string, person: {email: string}}}}>('https://api.notion.com/v1/oauth/token', {
    grant_type: 'authorization_code',
    redirect_uri: req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/notion/callback` : 'https://app.charmverse.io/api/notion/callback',
    code: tempAuthCode
  }, {
    headers: {
      Authorization: `Basic ${encodedToken}`,
      'Content-Type': 'application/json'
    }
  });
  const userId = token.owner.user.id;
  const notion = new Client({
    auth: token.access_token
  });

  // TODO: Paginate request
  const searchResult = await notion.search({
    page_size: 100
  });

  const cookies = new Cookies(req, res);
  cookies.set('notion-user', userId, {
    httpOnly: false,
    path: '/'
  });
  res.redirect(state.redirect);
});

export default handler;
