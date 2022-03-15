import Cookies from 'cookies';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { Client } from '@notionhq/client';
import * as http from 'adapters/http';

const notion = new Client({
  auth: process.env.NOTION_OAUTH_SECRET
});

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
  let state: any = {};
  try {
    state = JSON.parse(decodeURIComponent(req.query.state as string));
  }
  catch (e) {
    console.error('Error parsing state notion callback', e);
    res.status(400).send('Invalid state');
    return;
  }
  const encodedToken = Buffer.from(`${process.env.NOTION_OAUTH_CLIENT_ID}:${process.env.NOTION_OAUTH_SECRET}`, 'base64').toString();
  const token = await http.POST<{owner: {user: {id: string, person: {email: string}}}}>('https://api.notion.com/v1/oauth/token', {
    grant_type: 'authorization_code',
    // redirect_uri: redirectUri,
    code: tempAuthCode
  }, {
    headers: {
      Authorization: `Basic ${encodedToken}`,
      'Content-Type': 'application/json'
    }
  });

  const userId = token.owner.user.id;
  const userEmail = token.owner.user.person.email;
  console.log('wallet address', state.account);
  console.log({ userEmail, userId });

  console.log({ token });

  console.log(await notion.search({}));

  const cookies = new Cookies(req, res);
  cookies.set('notion-user', userId, {
    httpOnly: false,
    path: '/'
  });
  res.redirect(state.redirect);
});

export default handler;
