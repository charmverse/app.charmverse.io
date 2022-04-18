
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { requirePagePermissions } from 'lib/middleware/requirePagePermissions';
import { Page, Prisma } from '@prisma/client';
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

  const pageWithPermission = await prisma.page.update({
    where: {
      id: pageId
    },
    data: req.body,
    include: {
      permissions: true
    }
  });

  // Making sure the card page and card block metadata stays in sync
  if (pageWithPermission.type === 'card') {
    let shouldUpdate = false;
    let updatingFields = false;
    const blockUpdateInput: Prisma.BlockUpdateInput = {};

    if (req.body.title) {
      blockUpdateInput.title = req.body.title;
      shouldUpdate = true;
    }

    if (req.body.icon) {
      if (!blockUpdateInput.fields) {
        blockUpdateInput.fields = {};
      }
      (blockUpdateInput.fields as any).icon = req.body.icon;
      shouldUpdate = true;
      updatingFields = true;
    }

    if (req.body.headerImage) {
      if (!blockUpdateInput.fields) {
        blockUpdateInput.fields = {};
      }
      (blockUpdateInput.fields as any).headerImage = req.body.headerImage;
      shouldUpdate = true;
      updatingFields = true;
    }
    if (shouldUpdate) {
      if (updatingFields) {
        const cardBlockFields = await prisma.block.findUnique({
          where: {
            id: pageId
          },
          select: {
            fields: true
          }
        });
        if (cardBlockFields) {
          blockUpdateInput.fields = {
            ...(cardBlockFields?.fields as any),
            ...(blockUpdateInput.fields as any)
          };
        }
      }

      await prisma.block.update({
        where: {
          id: pageId
        },
        data: blockUpdateInput
      });
    }
  }
  return res.status(200).json(pageWithPermission);
}

async function deletePage (req: NextApiRequest, res: NextApiResponse) {

  await prisma.page.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
