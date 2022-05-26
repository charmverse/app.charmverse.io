
import { Application } from '@prisma/client';
import { prisma } from 'db';
import { createSubmission, SubmissionCreationData } from 'lib/applications/actions';
import { rollupBountyStatus } from 'lib/bounties/rollupBountyStatus';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireKeys } from 'lib/middleware/requireKeys';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<SubmissionCreationData>(['bountyId', 'submissionContent'], 'body'))
  .post(createSubmissionController);

async function createSubmissionController (req: NextApiRequest, res: NextApiResponse<Application>) {

  const { bountyId, submissionContent } = req.body;

  const bountySpaceId = await prisma.bounty.findUnique({
    where: {
      id: bountyId
    },
    select: {
      spaceId: true
    }
  });

  if (!bountySpaceId) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

  const userId = req.session.user.id;

  const { error } = await hasAccessToSpace({
    userId,
    spaceId: bountySpaceId.spaceId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  const createdSubmission = await createSubmission({
    bountyId,
    userId,
    submissionContent
  });

  rollupBountyStatus(createdSubmission.bountyId);

  return res.status(201).json(createdSubmission);
}

export default withSessionRoute(handler);
