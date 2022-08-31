
import { Application } from '@prisma/client';
import { approveApplication } from 'lib/applications/actions';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { prisma } from 'db';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import * as collabland from 'lib/collabland';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(approveUserApplication);

async function approveUserApplication (req: NextApiRequest, res: NextApiResponse<Application>) {
  const { id: applicationId } = req.query;
  const { id: userId } = req.session.user;

  const application = await prisma.application.findUnique({
    where: {
      id: applicationId as string
    },
    select: {
      bountyId: true
    }
  });

  if (!application) {
    throw new DataNotFoundError(`Application with id ${applicationId} not found`);
  }

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: application.bountyId,
    userId
  });

  if (!permissions.approve_applications) {
    throw new UnauthorisedActionError('You do not have the permission to approve applications for this bounty');
  }

  const approvedApplication = await approveApplication({
    applicationOrApplicationId: applicationId as string,
    userId
  });

  const bounty = await rollupBountyStatus(approvedApplication.bountyId);

  const author = await prisma.user.findUnique({
    where: {
      id: approvedApplication.createdBy
    },
    include: {
      discordUser: true
    }
  });

  if (author?.discordUser) {
    const space = await prisma.space.findUnique({
      where: {
        id: bounty.spaceId
      }
    });
    if (space) {
      await collabland.createBountyStartedCredential({
        bounty,
        page: bounty.page,
        space,
        discordUserId: author.discordUser.discordId
      });
    }
  }

  return res.status(200).json(approvedApplication);
}

export default withSessionRoute(handler);
