import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import * as http from 'adapters/http';
import { NextApiRequest } from 'next';
import { importFromWorkspace } from 'lib/notion/importFromWorkspace';

const handler = nc({
  onError,
  onNoMatch
});

handler.get(async (req: NextApiRequest, res) => {
  let state: {
    account: string,
    redirect: string
    spaceId: string
    userId: string,
    code: string
  } = {} as any;
  try {
    state = JSON.parse(decodeURIComponent(req.query.state as string));
  }
  catch (e) {
    console.error('Error parsing state notion callback', e);
    res.status(400).send({ error: 'Invalid state' });
    return;
  }

  const tempAuthCode = state.code;
  if (req.query.error || !tempAuthCode) {
    res.status(400).send({ error: 'Invalid code' });
    return;
  }

  const encodedToken = Buffer.from(`${process.env.NOTION_OAUTH_CLIENT_ID}:${process.env.NOTION_OAUTH_SECRET}`).toString('base64');

  try {
    const token = await http.POST<{ workspace_name: string, workspace_icon: string, access_token: string, owner: { user: { id: string, person: { email: string } } } }>('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      redirect_uri: req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/notion/callback` : 'https://app.charmverse.io/api/notion/callback',
      code: tempAuthCode
    }, {
      headers: {
        Authorization: `Basic ${encodedToken}`,
        'Content-Type': 'application/json'
      }
    });
    await importFromWorkspace({
      accessToken: token.access_token,
      spaceId: state.spaceId,
      userId: state.userId,
      workspaceName: token.workspace_name,
      workspaceIcon: token.workspace_icon
    });
    res.status(200).send({ error: null });

  }
  catch (err) {
    res.status(400).send({ error: 'Invalid code' });
  }
});

export default handler;
