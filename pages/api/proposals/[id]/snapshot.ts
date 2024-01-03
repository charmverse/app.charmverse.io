import type { PageMeta } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { getPage } from 'lib/pages/server';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSnapshotProposal } from 'lib/snapshot/getProposal';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { coerceToMilliseconds } from 'lib/utilities/dates';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .use(requireKeys(['snapshotProposalId', 'evaluationId'], 'body'))
  .put(recordSnapshotInfo);

async function recordSnapshotInfo(req: NextApiRequest, res: NextApiResponse<PageMeta>) {
  const { snapshotProposalId, evaluationId } = req.body;

  const pageId = req.query.id as string;

  const page = await getPage(pageId);

  if (!page) {
    throw new DataNotFoundError();
  }

  const { error } = await hasAccessToSpace({
    spaceId: page.spaceId as string,
    userId: req.session.user.id
  });

  if (error) {
    throw error;
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
