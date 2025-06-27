import { prisma } from '@charmverse/core/prisma-client';
import type { PageMeta } from '@packages/core/pages';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getSnapshotProposal } from '@packages/lib/snapshot/getProposal';
import { coerceToMilliseconds } from '@packages/lib/utils/dates';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { DataNotFoundError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getPage } from 'lib/pages/server';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['snapshotProposalId', 'evaluationId'], 'body'))
  .put(recordSnapshotInfo);

async function recordSnapshotInfo(req: NextApiRequest, res: NextApiResponse<PageMeta>) {
  const { snapshotProposalId, evaluationId } = req.body;

  const proposalId = req.query.id as string;

  const page = await getPage(proposalId);

  if (!page) {
    throw new DataNotFoundError();
  }

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId: req.session.user.id
  });

  if (!permissions.create_vote) {
    throw new ActionNotPermittedError(`You can't create a vote on this proposal.`);
  }

  const snapshotProposal = snapshotProposalId ? await getSnapshotProposal(snapshotProposalId) : null;

  await prisma.proposalEvaluation.update({
    where: {
      id: evaluationId
    },
    data: {
      snapshotId: snapshotProposalId,
      snapshotExpiry: snapshotProposal?.end ? new Date(coerceToMilliseconds(snapshotProposal.end)) : null
    }
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
