import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { DisconnectGoogleAccountRequest } from '@packages/lib/google/disconnectGoogleAccount';
import { disconnectGoogleAccount } from '@packages/lib/google/disconnectGoogleAccount';
import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys<DisconnectGoogleAccountRequest>(['googleAccountEmail'], 'body'))
  .post(disconnectGoogleAccountController);

async function disconnectGoogleAccountController(req: NextApiRequest, res: NextApiResponse) {
  const disconnectRequest = { ...req.body, userId: req.session.user.id } as DisconnectGoogleAccountRequest;

  const loggedInUser = await disconnectGoogleAccount(disconnectRequest);

  res.status(200).send(loggedInUser);
}

export default withSessionRoute(handler);
