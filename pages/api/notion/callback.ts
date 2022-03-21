import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req, res) => {
  const tempAuthCode = req.query.code;
  if (req.query.error || !tempAuthCode) {
    res.status(400).send('Error or missing code from Notion OAuth');
    return;
  }

  let redirect: string;
  try {
    const state = JSON.parse(decodeURIComponent(req.query.state as string));
    redirect = state.redirect;
  }
  catch (e) {
    console.error('Error parsing state notion callback', e);
    // TODO: Error page
    res.status(400).send('Invalid callback state');
    return;
  }

  res.redirect(`${redirect}?code=${tempAuthCode}`);
});

export default handler;
