import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { CreateProposalInput } from 'lib/proposal/createProposal';
import { createProposal } from 'lib/proposal/createProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { AdministratorOnlyError } from 'lib/users/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'categoryId',
      resourceIdType: 'proposalCategory',
      location: 'body'
    })
  )
  .post(createProposalController);

async function createProposalController(req: NextApiRequest, res: NextApiResponse<{ id: string }>) {
  const proposaCreateProps = req.body as CreateProposalInput;

  if (proposaCreateProps.pageProps?.type === 'proposal_template') {
    const adminRole = await prisma.spaceRole.findFirst({
      where: {
        isAdmin: true,
        userId: req.session.user.id,
        spaceId: proposaCreateProps.spaceId
      }
    });

    if (!adminRole) {
      throw new AdministratorOnlyError();
    }
  } else {
    const permissions = await req.basePermissionsClient.proposals.computeProposalCategoryPermissions({
      resourceId: proposaCreateProps.categoryId,
      userId: req.session.user.id
    });

    if (!permissions.create_proposal) {
      throw new ActionNotPermittedError('You cannot create new proposals');
    }
  }
  const proposalPage = await createProposal({
    ...req.body,
    userId: req.session.user.id
  });
  const pages = await getPageMetaList([proposalPage.page.id]);
  relay.broadcast(
    {
      type: 'pages_created',
      payload: pages
    },
    proposalPage.page.spaceId
  );

  return res.status(201).json({ id: proposalPage.proposal.id });
}

export default withSessionRoute(handler);
