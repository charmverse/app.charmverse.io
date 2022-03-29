import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import log from 'lib/log';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {
  const tempAuthCode = req.query.code;
  if (req.query.error || !tempAuthCode) {
    res.status(400).send('Error or missing code from Discord OAuth');
    return;
  }
  let redirect: string;
  let type: 'connect' | 'server' = 'connect';
  try {
    const state = JSON.parse(decodeURIComponent(req.query.state as string));
    redirect = state.redirect;
    type = state.type;
  }
  catch (e) {
    log.warn('Error parsing state discord callback', e);
    // TODO: Error page
    res.status(400).send('Invalid callback state');
    return;
  }

  res.redirect(`${redirect}?code=${tempAuthCode}&discord=1&type=${type}`);
});

export default handler;
