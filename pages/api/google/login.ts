import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { loginWithGoogle } from 'lib/google/loginWithGoogle';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { saveSession } from 'lib/middleware/saveSession';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys(['accessToken'], 'body')).post(loginWithGoogleController);

export type LoginWithGoogleRequest = {
  accessToken: string;
};

async function loginWithGoogleController(req: NextApiRequest, res: NextApiResponse) {
  const { accessToken } = req.body as LoginWithGoogleRequest;

  const loggedInUser = await loginWithGoogle(accessToken as string);

  await saveSession({ req, userId: loggedInUser.id });

  res.status(200).send(loggedInUser);
}

export default withSessionRoute(handler);
