import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const isTestEnv = process.env.ENABLE_TEST_LOGIN === 'true';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

if (isTestEnv) {
  handler
    .post(login);
}

export type TestLoginRequest = {
  userId: string;
}

async function login (req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.body as TestLoginRequest;

  req.session.user = { id: userId };

  await req.session.save();

  return res.status(200).send({});
}

export default withSessionRoute(handler);
