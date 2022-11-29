import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { updateGuildRolesForUser } from 'lib/guild-xyz/server/updateGuildRolesForUser';
import { updateTrackUserProfile } from 'lib/metrics/mixpanel/updateTrackUserProfile';
import { extractSignupAnalytics } from 'lib/metrics/mixpanel/utilsSignup';
import { logSignupViaWallet } from 'lib/metrics/postToDiscord';
import type { SignupCookieType } from 'lib/metrics/userAcquisition/interfaces';
import { signupCookieNames } from 'lib/metrics/userAcquisition/interfaces';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireWalletSignature } from 'lib/middleware/requireWalletSignature';
import { sessionUserRelations } from 'lib/session/config';
import { withSessionRoute } from 'lib/session/withSession';
import { createUserFromWallet } from 'lib/users/createUser';
import { getUserProfile } from 'lib/users/getUser';
import type { LoggedInUser } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(createUserFromUnstoppableDomains);

async function createUserFromUnstoppableDomains(
  req: NextApiRequest,
  res: NextApiResponse<LoggedInUser | { error: any }>
) {
  // TODO Verify inbound request is legitimately from Unstoppable Domains
  res.status(200).send({} as any);
}
