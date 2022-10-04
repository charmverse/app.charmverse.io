
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getBounty, reviewBountySuggestion } from 'lib/bounties';
import { } from 'lib/bounties/reviewBountySuggestion';
import type { BountyWithDetails } from 'lib/bounties';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['decision'], 'body'))
  .post(reviewSuggestionController);

async function reviewSuggestionController (req: NextApiRequest, res: NextApiResponse<BountyWithDetails | { success: true }>) {

  const { id: bountyId } = req.query;

  const bounty = await getBounty(bountyId as string);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  const userId = req.session.user.id;

  const { error, isAdmin } = await hasAccessToSpace({
    userId,
    spaceId: bounty.spaceId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  if (isAdmin !== true) {
    throw new UnauthorisedActionError('You cannot close submissions for this bounty.');
  }

  const { decision } = req.body;

  const processedSuggestion = await reviewBountySuggestion({
    bountyId: bountyId as string,
    decision
  });

  const returnContent = (processedSuggestion as any) === true ? { success: true } as const : processedSuggestion;

  return res.status(200).json(returnContent);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events as
