import Cookies from 'cookies';
import nc from 'next-connect';

import log from 'lib/log';
import { onError, onNoMatch } from 'lib/middleware';
import { AUTH_CODE_COOKIE, AUTH_ERROR_COOKIE } from 'lib/notion/constants';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {
  const tempAuthCode = req.query.code;
  let redirect: string;
  try {
    const state = req.query.state ? JSON.parse(decodeURIComponent(req.query.state as string)) : {};
    redirect = state.redirect;
  }
  catch (e) {
    log.warn('Error parsing state notion callback', e);
    // TODO: Error page
    res.status(400).send('Invalid callback state');
    return;
  }

  // use cookies to pass response to frontend because they're easier to delete than query params
  const cookies = new Cookies(req, res);

  if (typeof tempAuthCode === 'string') {
    cookies.set(AUTH_CODE_COOKIE, tempAuthCode, { httpOnly: false, sameSite: 'strict' });
  }
  else {
    log.warn('Error importing from notion', req.query);
    cookies.set(AUTH_ERROR_COOKIE, 'There was an error from Notion. Please try again', { httpOnly: false, sameSite: 'strict' });
  }

  res.redirect(redirect);
});

export default handler;
