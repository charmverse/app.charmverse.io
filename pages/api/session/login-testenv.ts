import type { IdentityType } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { isTestEnv } from 'config/constants';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

if (isTestEnv) {
  handler.post(login);
}

export type TestLoginRequest = {
  anonymousUserId?: string;
  userId?: string;
  otpUser?: { id: string; method: IdentityType };
};

async function login(req: NextApiRequest, res: NextApiResponse) {
  const { anonymousUserId, userId, otpUser } = req.body as TestLoginRequest;

  if (userId) {
    req.session.user = { id: userId };
  } else if (otpUser) {
    req.session.otpUser = otpUser;
  } else if (anonymousUserId) {
    req.session.anonymousUserId = anonymousUserId;
  }

  await req.session.save();

  return res.status(200).send({});
}

export default withSessionRoute(handler);
