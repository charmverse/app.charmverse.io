
import type { PagePermission } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { findParentOfType } from 'lib/pages/findParentOfType';
import { PageNotFoundError, resolvePageTree } from 'lib/pages/server';
import type { IPagePermissionRequest, IPagePermissionToDelete, IPagePermissionWithAssignee, IPagePermissionWithSource, IPagePermissionToCreate } from 'lib/permissions/pages';
import { deletePagePermission, listPagePermissions, setupPermissionsAfterPagePermissionAdded, upsertPermission, computeUserPagePermissions, getPagePermission } from 'lib/permissions/pages';
import { PermissionNotFoundError } from 'lib/permissions/pages/errors';
import { boardPagePermissionUpdated } from 'lib/permissions/pages/triggers';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
//  .use(requireSpaceMembership)
  .get(findPagePermissions)
  .delete(removePagePermission)
  .use(requireKeys<PagePermission>(['pageId'], 'body'))
  .post(addPagePermission);

async function findPagePermissions (req: NextApiRequest, res: NextApiResponse<IPagePermissionWithAssignee[]>) {

  const { pageId } = req.query as any as IPagePermissionRequest;

  const permissions = await listPagePermissions(pageId);

  return res.status(200).json(permissions);
}

async function addPagePermission (req: NextApiRequest, res: NextApiResponse<IPagePermissionWithSource>) {

  const { pageId, permissionLevel } = req.body as Required<IPagePermissionToCreate>;

  const computedPermissions = await computeUserPagePermissions({
    pageId,
    userId: req.session.user.id
  });

  if (req.body.public === true && computedPermissions.edit_isPublic !== true) {
    throw new ActionNotPermittedError('You cannot make page public.');
  }
  else if (req.body.public !== true && computedPermissions.grant_permissions !== true) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  }
  else if (permissionLevel === 'proposal_editor') {
    throw new ActionNotPermittedError('This permission level can only be created automatically by proposals.');
  }
  else if (req.body.public === true && permissionLevel !== 'view') {
    throw new ActionNotPermittedError('Only view permissions can be provided to public.');
  }

  const createdPermission = await prisma.$transaction(async (tx) => {
    const page = await tx.page.findUnique({
      where: {
        id: pageId
      }
    });

    if (!page) {
      throw new PageNotFoundError(pageId);
    }

    if (page.type === 'proposal' && req.body.public !== true) {
      throw new ActionNotPermittedError('You cannot manually update permissions for proposals.');
    }

    // Count before and after permissions so we don't trigger the event unless necessary
    const permissionsBefore = await tx.pagePermission.count({
      where: {
        pageId
      }
    });

    const pageTree = await resolvePageTree({
      pageId: page.id,
      flattenChildren: true,
      tx
    });

    const proposalParentId = findParentOfType({ targetPageTree: pageTree, pageType: 'proposal' });

    if (proposalParentId) {
      throw new ActionNotPermittedError('You cannot manually update permissions for child pages of proposals.');
    }

    const newPermission = await upsertPermission(pageId, req.body, pageTree, tx);

    // Override behaviour, we always cascade board permissions downwards
    if (page.type.match(/board/)) {
      await boardPagePermissionUpdated({ boardId: pageId, permissionId: newPermission.id, tx });

    }
    // Existing behaviour where we setup permissions after a page permission is added, and account for inheritance conditions
    else {
      const permissionsAfter = await tx.pagePermission.count({
        where: {
          pageId
        }
      });

      if (permissionsAfter > permissionsBefore) {
        await setupPermissionsAfterPagePermissionAdded(newPermission.id, tx);
      }
    }

    updateTrackPageProfile(pageId);

    return newPermission;
  });

  return res.status(201).json(createdPermission);
}

async function removePagePermission (req: NextApiRequest, res: NextApiResponse) {

  const { permissionId } = req.body as IPagePermissionToDelete;

  const permission = await getPagePermission(permissionId);

  if (!permission) {
    throw new PermissionNotFoundError(permissionId);
  }

  const computedPermissions = await computeUserPagePermissions({
    pageId: permission.pageId,
    userId: req.session.user.id
  });

  if (permission.public && computedPermissions.edit_isPublic !== true) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  }
  else if (!permission.public && computedPermissions.grant_permissions !== true) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  }

  const pageTree = await resolvePageTree({
    pageId: permission.pageId,
    flattenChildren: true
  });

  const proposalParentId = findParentOfType({ targetPageTree: pageTree, pageType: 'proposal' });

  if (proposalParentId) {
    throw new ActionNotPermittedError('You cannot manually update permissions for child pages of proposals.');
  }

  await deletePagePermission(permissionId);

  updateTrackPageProfile(permission.pageId);

  return res.status(200).json({
    success: true
  });
}

export default withSessionRoute(handler);
