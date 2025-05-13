import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from '@packages/lib/middleware';
import { getPageMarkdown } from 'lib/pages/getPageMarkdown';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPageMarkdownEndpoint);

async function getPageMarkdownEndpoint(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const userId = req.session?.user?.id;

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (!permissions.read) {
    throw new ActionNotPermittedError('You do not have permissions to view this page');
  }

  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    select: {
      proposalId: true
    }
  });
  // A proposal can only be updated when its in draft or discussion status and only the proposal author can update it
  const proposalPermissions = page.proposalId
    ? await permissionsApiClient.proposals.computeProposalPermissions({
        resourceId: page.proposalId,
        userId
      })
    : null;

  const markdownContent = await getPageMarkdown({
    pageId,
    includePrivateFields: proposalPermissions?.view_private_fields
  });

  res.status(200).json(markdownContent);
}

export default withSessionRoute(handler);
