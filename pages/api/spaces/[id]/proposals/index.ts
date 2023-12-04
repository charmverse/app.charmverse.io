import { prisma } from '@charmverse/core/prisma-client';
import type { ListProposalsRequest, ProposalWithUsers } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { mapDbProposalToProposal } from 'lib/proposal/mapDbProposalToProposal';
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
  .get(getProposals)
  // leaving this here until clients are updated - Aug 8, 2023
  .post(deprecatedGetProposals);

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
      category: true,
      rewards: true
    }
  });

  return res.status(200).json(proposals.map(mapDbProposalToProposal));
}

async function deprecatedGetProposals(req: NextApiRequest, res: NextApiResponse<ProposalWithUsers[]>) {
  const body = req.body as Pick<ListProposalsRequest, 'categoryIds'>;
  const userId = req.session.user?.id;
  const spaceId = req.query.id as string;

  const proposals = await req.basePermissionsClient.proposals.getAccessibleProposals({
    categoryIds: body.categoryIds,
    spaceId,
    userId
  });

  return res.status(200).json(proposals);
}

export default withSessionRoute(handler);
