
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser, ActionNotPermittedError } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { requirePagePermissions } from 'lib/middleware/requirePagePermissions';
import { Page } from '@prisma/client';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['id'], 'query'))
  .use(requireUser)
  .put(updatePage)
  .delete(requirePagePermissions(['delete'], deletePage));

async function updatePage (req: NextApiRequest, res: NextApiResponse) {

  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  const updateContent = req.body as Page;

  // eslint-disable-next-line eqeqeq
  if (updateContent.isPublic != undefined && permissions.edit_isPublic !== true) {
    return res.status(401).json({
      error: 'You cannot update the public status of this page'
    });

  }
  else if (permissions.edit_content !== true) {
    return res.status(401).json({
      error: 'You cannot update this page'
    });
  }

  const space = await prisma.page.update({
    where: {
      id: req.query.id as string
    },
    data: req.body,
    include: {
      permissions: true
    }
  });
  return res.status(200).json(space);
}

async function deletePage (req: NextApiRequest, res: NextApiResponse) {

  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.delete !== true) {
    throw new ActionNotPermittedError('You are not allowed to delete this page.');
  }

  await prisma.page.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
