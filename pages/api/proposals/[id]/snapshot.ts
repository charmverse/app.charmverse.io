import type { PageMeta } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser, ActionNotPermittedError } from 'lib/middleware';
import { getPage } from 'lib/pages/server';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { getSnapshotProposal } from 'lib/snapshot/getProposal';
import { coerceToMilliseconds } from 'lib/utils/dates';
import { DataNotFoundError } from 'lib/utils/errors';

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
