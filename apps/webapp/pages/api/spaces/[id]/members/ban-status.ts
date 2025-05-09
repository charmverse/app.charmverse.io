import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { checkUserSpaceBanStatus } from '@packages/lib/members/checkUserSpaceBanStatus';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(checkSpaceBanStatusHandler);

async function checkSpaceBanStatusHandler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  const spaceId = req.query.id as string;
  const { discordId, email, walletAddress } = req.query as {
    discordId?: string;
    walletAddress?: string;
    email?: string;
  };

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceIds: [spaceId],
    userId,
    discordId,
    emails: email ? [email] : [],
    walletAddresses: walletAddress ? [walletAddress] : []
  });

  res.status(200).json({ isBanned: isUserBannedFromSpace });
}

export default withSessionRoute(handler);
