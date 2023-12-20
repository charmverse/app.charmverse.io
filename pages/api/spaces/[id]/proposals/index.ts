import type { ProposalPermissionsSwitch } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers, ListProposalsRequest } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/routers';
import { mapDbProposalToProposalLite } from 'lib/proposal/mapDbProposalToProposal';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposals);

async function getProposals(req: NextApiRequest, res: NextApiResponse<ProposalWithUsers[]>) {
  const userId = req.session.user?.id;

  const spaceId = req.query.id as string;

  const { categoryIds, onlyAssigned, useProposalEvaluationPermissions } = req.query as any as ListProposalsRequest &
    ProposalPermissionsSwitch;
  const proposalIds = await permissionsApiClient.proposals.getAccessibleProposalIds({
    categoryIds,
    onlyAssigned,
    userId,
    spaceId,
    useProposalEvaluationPermissions
  });

  const proposals = await prisma.proposal.findMany({
    where: {
      id: {
        in: proposalIds
      },
      page: {
        // Ignore proposal templates
        type: 'proposal'
      }
    },
    include: {
      authors: true,
      reviewers: true,
      category: true,
      rewards: true,
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        include: {
          reviewers: true
        }
      },
      form: {
        include: {
          formFields: true
        }
      }
    }
  });

  const proposalsWithUsers: ProposalWithUsers[] = proposals.map((proposal) => {
    return mapDbProposalToProposalLite({ proposal });
  });

  return res.status(200).json(proposalsWithUsers);
}

export default withSessionRoute(handler);
