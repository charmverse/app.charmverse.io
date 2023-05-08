import { prisma } from '@charmverse/core';
import type { Application } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { SubmissionCreationData } from 'lib/applications/actions';
import { createSubmission } from 'lib/applications/actions';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { computeBountyPermissions } from 'lib/permissions/bounties';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<SubmissionCreationData>(['bountyId', 'submissionContent'], 'body'))
  .post(createSubmissionController);

async function createSubmissionController(req: NextApiRequest, res: NextApiResponse<Application>) {
  const { bountyId, submissionContent } = req.body;

  const bountySpace = await prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    select: {
      spaceId: true,
      approveSubmitters: true,
      customReward: true
    }
  });

  if (!bountySpace) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  const userId = req.session.user.id;

  const permissions = await computeBountyPermissions({
    allowAdminBypass: true,
    resourceId: bountyId,
    userId
  });

  if (!permissions.work) {
    throw new UnauthorisedActionError(
      `You do not have the permission to ${
        bountySpace.approveSubmitters === true ? 'apply' : 'submit work'
      } to this bounty`
    );
  }

  const createdSubmission = await createSubmission({
    bountyId,
    userId,
    submissionContent,
    customReward: isTruthy(bountySpace.customReward)
  });

  await rollupBountyStatus(createdSubmission.bountyId);

  return res.status(201).json(createdSubmission);
}

export default withSessionRoute(handler);
