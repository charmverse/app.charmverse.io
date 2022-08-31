
import { closeOutBounty, getBountyOrThrow } from 'lib/bounties';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { BountyWithDetails } from 'models';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import * as collabland from 'lib/collabland';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(closeBountyController);

async function closeBountyController (req: NextApiRequest, res: NextApiResponse<BountyWithDetails>) {

  const { id: bountyId } = req.query;

  const bounty = await getBountyOrThrow(bountyId as string);

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bounty.id,
    userId
  });

  if (!permissions.lock) {
    throw new UnauthorisedActionError('You do not have the permission to close this bounty');
  }

  const completeBounty = await closeOutBounty(bountyId as string);

  const completedApplications = completeBounty.applications.filter((application) => application.status === 'complete');

  const space = await prisma.space.findUnique({
    where: {
      id: completeBounty.spaceId
    }
  });

  for (const application of completedApplications) {
    const discordUser = await prisma.discordUser.findUnique({
      where: {
        userId: application.createdBy
      }
    });
    if (space && discordUser) {
      await collabland.createBountyCompletedCredential({
        bounty,
        page: bounty.page,
        space,
        discordUserId: discordUser.discordId
      });
    }
  }

  return res.status(200).json(completeBounty);
}

export default withSessionRoute(handler);

// --------- Add logging events
// These events as
