import type { PageMeta } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { convertPageToProposal } from 'lib/proposal/convertPageToProposal';
import { disconnectProposalChildren } from 'lib/proposal/disconnectProposalChildren';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

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
  .post(convertToProposal);

async function convertToProposal(req: NextApiRequest, res: NextApiResponse<PageMeta>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      parentId: true,
      type: true,
      spaceId: true,
      content: true,
      title: true,
      contentText: true
    }
  });

  if (!page) {
    throw new NotFoundError();
  }

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }

  const proposalPermissions = await permissionsApiClient.spaces.computeSpacePermissions({
    resourceId: page.spaceId,
    userId
  });

  if (!proposalPermissions.createProposals) {
    throw new UnauthorisedActionError('You do not have permission to create a proposal in this category');
  }

  const proposalPage = await convertPageToProposal({
    page,
    userId
  });

  // Launch this job in the background
  disconnectProposalChildren({
    pageId: proposalPage.id
  });

  updateTrackPageProfile(proposalPage.id);

  relay.broadcast(
    {
      type: 'pages_created',
      payload: [proposalPage]
    },
    proposalPage.spaceId
  );

  return res.status(200).json(proposalPage);
}

export default withSessionRoute(handler);
