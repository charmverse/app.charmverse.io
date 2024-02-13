import { prisma } from '@charmverse/core/prisma-client';
import type { ListProposalsRequest } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { getProposals } from 'lib/proposal/getProposals';
import type { ProposalWithUsersLite } from 'lib/proposal/getProposals';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalsEndpoint);

async function getProposalsEndpoint(req: NextApiRequest, res: NextApiResponse<ProposalWithUsersLite[]>) {
  const userId = req.session.user?.id;

  const spaceId = req.query.id as string;

  const { onlyAssigned } = req.query as any as ListProposalsRequest;
  const ids = await permissionsApiClient.proposals.getAccessibleProposalIds({
    onlyAssigned,
    userId,
    spaceId
  });

  const proposals = await getProposals({ ids });

  return res.status(200).json(proposals);
}

export default withSessionRoute(handler);
