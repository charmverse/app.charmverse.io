import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import log from 'lib/log';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {

  const state = JSON.parse(decodeURIComponent(req.query.state as string));
  const redirect = state?.redirect;
  const type: 'connect' | 'server' = state.type ?? 'connect';

  if (!redirect || !type) {

    const error = { error: 'Invalid state in discord callback' };

    log.warn('Error parsing state discord callback', error);
    // TODO: Error page
    res.status(400).send(error);
    return;
  }

  const tempAuthCode = req.query.code;
  if (req.query.error || !tempAuthCode) {

    res.redirect(
      `${redirect}?discord=2&type=${type}`
    );
    return;
  }

  res.redirect(`${redirect}?code=${tempAuthCode}&discord=1&type=${type}`);
});

export default handler;
