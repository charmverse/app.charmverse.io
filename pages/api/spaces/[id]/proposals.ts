import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { ListProposalsRequest } from 'lib/proposal/getProposalsBySpace';
import type { ProposalWithUsers } from 'lib/proposal/interface';
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
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .post(getProposals);

async function getProposals(req: NextApiRequest, res: NextApiResponse<ProposalWithUsers[]>) {
  const body = req.body as Pick<ListProposalsRequest, 'categoryIds'>;
  const { id: userId } = req.session.user;
  const spaceId = req.query.id as string;

  const proposals = await req.basePermissionsClient.proposals.getAccessibleProposals({
    categoryIds: body.categoryIds,
    spaceId,
    userId
  });

  return res.status(200).json(proposals);
}

export default withSessionRoute(handler);
