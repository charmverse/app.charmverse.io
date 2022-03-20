import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';

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
    res.status(400).send({ error: 'Invalid state' });
    return;
  }

  res.redirect(`${state.redirect}?state=${encodeURIComponent(JSON.stringify({ ...state, code: tempAuthCode }))}`);
});

export default handler;
