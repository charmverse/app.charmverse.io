import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { ConnectGoogleAccountRequest } from 'lib/google/connectGoogleAccount';
import { connectGoogleAccount } from 'lib/google/connectGoogleAccount';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { saveSession } from 'lib/middleware/saveSession';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys<ConnectGoogleAccountRequest>(['accessToken', 'displayName', 'avatarUrl'], 'body'))
  .post(connectGoogleAccountController);

async function connectGoogleAccountController(req: NextApiRequest, res: NextApiResponse) {
  const connectRequest = { ...req.body, userId: req.session.user.id } as ConnectGoogleAccountRequest;

  const loggedInUser = await connectGoogleAccount(connectRequest);

  await saveSession({ req, userId: loggedInUser.id });

  res.status(200).send(loggedInUser);
}

export default withSessionRoute(handler);
