import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, ActionNotPermittedError } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { generateMarkdown } from 'lib/prosemirror/markdown/generateMarkdown';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPageMarkdown);

async function getPageMarkdown(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const userId = req.session?.user?.id;

  const page = await prisma.page.findFirstOrThrow({
    where: { id: pageId }
  });

  // Page ID might be a path now, so first we fetch the page and if found, can pass the id from the found page to check if we should actually send it to the requester
  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: page.id,
    userId
  });

  if (!permissions.read) {
    throw new ActionNotPermittedError('You do not have permissions to view this page');
  }

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: page.spaceId
    },
    include: {
      user: true
    }
  });
  const spaceMembers = spaceRoles.map((role) => role.user);

  const markdownContent = await generateMarkdown({
    content: page.content,
    generatorOptions: {
      members: spaceMembers
    }
  });

  res.status(200).json(markdownContent);
}

export default withSessionRoute(handler);
