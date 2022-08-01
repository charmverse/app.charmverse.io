
import { Bounty } from '@prisma/client';
import { prisma } from 'db';
import { BountyCreationData, createBounty, listAvailableBounties } from 'lib/bounties';
import { IEventToLog, postToDiscord } from 'lib/log/userEvents';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { AvailableResourcesRequest } from 'lib/permissions/interfaces';
import { createProposal } from 'lib/proposals';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { BountyWithDetails } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { PageWithProposal } from 'lib/proposals/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(createProposalController);

async function createProposalController (req: NextApiRequest, res: NextApiResponse<PageWithProposal>) {

  const { spaceId } = req.body as BountyCreationData;

  const { id: userId } = req.session.user;

  const permissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: spaceId as string,
    userId
  });

  if (!permissions.createPage) {
    throw new UnauthorisedActionError('You do not have permission to create a proposal');
  }

  const pageWithProposal = await createProposal({
    spaceId,
    userId
  });

  return res.status(201).json(pageWithProposal);
}

export default withSessionRoute(handler);
