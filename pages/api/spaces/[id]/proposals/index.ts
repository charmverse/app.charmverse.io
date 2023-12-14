import { prisma } from '@charmverse/core/prisma-client';
import type { ListProposalsRequest, ProposalWithUsers } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'space'
    })
  )
  .get(getProposals);

async function getProposals(req: NextApiRequest, res: NextApiResponse<ProposalWithUsers[]>) {
  const categoryIds = req.query.categoryIds;
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;
  const onlyAssigned = req.query.onlyAssigned === 'true';

  const proposalIds = await req.basePermissionsClient.proposals.getAccessibleProposalIds({
    spaceId,
    categoryIds,
    onlyAssigned,
    userId
  });

  const proposals = await prisma.proposal.findMany({
    where: {
      id: {
        in: proposalIds
      }
    },
    include: {
      authors: true,
      reviewers: true,
      category: true
    }
  });

  return res.status(200).json(proposals);
}
export default withSessionRoute(handler);
