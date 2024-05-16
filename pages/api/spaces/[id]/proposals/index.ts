import type { ListProposalsRequest } from '@charmverse/core/proposals';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { concealProposalSteps } from 'lib/proposals/concealProposalSteps';
import type { ProposalWithUsersLite } from 'lib/proposals/getProposals';
import { getProposals } from 'lib/proposals/getProposals';
import { getAssignedRoleIds } from 'lib/roles/getAssignedRoleIds';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getProposalsEndpoint);

export const config = {
  api: {
    // silence errors about response size
    // https://nextjs.org/docs/messages/api-routes-response-size-limit
    responseLimit: false
  }
};

async function getProposalsEndpoint(req: NextApiRequest, res: NextApiResponse<ProposalWithUsersLite[]>) {
  const userId = req.session.user?.id;

  const spaceId = req.query.id as string;

  const { onlyAssigned } = req.query as any as ListProposalsRequest;
  const ids = await permissionsApiClient.proposals.getAccessibleProposalIds({
    onlyAssigned,
    userId,
    spaceId
  });

  const proposals = await getProposals({ ids, spaceId });

  const userRoleIds = await getAssignedRoleIds({ spaceId, userId });

  const { isAdmin } = await hasAccessToSpace({ spaceId, userId });

  const proposalsWithConcealedSteps = await Promise.all(
    proposals.map((p) =>
      concealProposalSteps({
        proposal: {
          ...p,
          evaluations: p.evaluations.map((ev) => ({
            ...ev,
            reviewers: p.reviewers.filter((r) => r.evaluationId === ev.id)
          }))
        },
        userId,
        applicableRoleIds: userRoleIds,
        isAdmin
      })
    )
  );

  return res.status(200).json(proposalsWithConcealedSteps);
}

export default withSessionRoute(handler);
