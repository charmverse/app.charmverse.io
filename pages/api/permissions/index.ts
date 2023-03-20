/* eslint-disable no-console */
import type { PagePermission } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { sendMagicLink } from 'lib/google/sendMagicLink';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { PageNotFoundError } from 'lib/pages/server';
import type {
  IPagePermissionRequest,
  IPagePermissionToCreate,
  IPagePermissionToDelete,
  IPagePermissionWithAssignee,
  IPagePermissionWithSource
} from 'lib/permissions/pages';
import {
  computeUserPagePermissions,
  deletePagePermission,
  getPagePermission,
  listPagePermissions,
  setupPermissionsAfterPagePermissionAdded,
  upsertPermission
} from 'lib/permissions/pages';
import { PermissionNotFoundError } from 'lib/permissions/pages/errors';
import { boardPagePermissionUpdated } from 'lib/permissions/pages/triggers';
import { addGuest } from 'lib/roles/addGuest';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { isUUID, isValidEmail } from 'lib/utilities/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  //  .use(requireSpaceMembership)
  .get(findPagePermissions)
  .delete(removePagePermission)
  .use(requireKeys<PagePermission>(['pageId'], 'body'))
  .post(addPagePermission);

async function findPagePermissions(req: NextApiRequest, res: NextApiResponse<IPagePermissionWithAssignee[]>) {
  const { pageId } = req.query as any as IPagePermissionRequest;

  const permissions = await listPagePermissions(pageId);

  return res.status(200).json(permissions);
}

async function addPagePermission(req: NextApiRequest, res: NextApiResponse<IPagePermissionWithSource>) {
  const { pageId, permissionLevel } = req.body as Required<IPagePermissionToCreate>;

  const computedPermissions = await computeUserPagePermissions({
    resourceId: pageId,
    userId: req.session.user.id
  });

  if (req.body.public === true && computedPermissions.edit_isPublic !== true) {
    throw new ActionNotPermittedError('You cannot make page public.');
  } else if (req.body.public !== true && computedPermissions.grant_permissions !== true) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  } else if (permissionLevel === 'proposal_editor') {
    throw new ActionNotPermittedError('This permission level can only be created automatically by proposals.');
  } else if (req.body.public === true && permissionLevel !== 'view') {
    throw new ActionNotPermittedError('Only view permissions can be provided to public.');
  }

  const permissionData = { ...req.body } as IPagePermissionToCreate;
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      type: true,
      spaceId: true,
      path: true
    }
  });

  if (!page) {
    throw new DataNotFoundError('Page not found');
  }

  // Usually a userId, but can be an email
  const userIdAsEmail = req.body.userId;

  // Store these in top level scope, so we can send an email to the user after the page permission is created
  let isNewSpaceMember = false;
  let spaceDomain: string = '';

  // Handle case where we are sharing a page
  if (isValidEmail(userIdAsEmail)) {
    const addGuestResult = await addGuest({
      spaceId: page.spaceId,
      userIdOrEmail: userIdAsEmail
    });

    isNewSpaceMember = addGuestResult.isNewSpaceRole;
    spaceDomain = addGuestResult.spaceDomain;

    permissionData.userId = addGuestResult.user.id;
  }

  const createdPermission = await prisma.$transaction(
    async (tx) => {
      if (page.type === 'proposal' && typeof req.body.public !== 'boolean') {
        throw new ActionNotPermittedError('You cannot manually update permissions for proposals.');
      }

      // Count before and after permissions so we don't trigger the event unless necessary
      const permissionsBefore = await tx.pagePermission.count({
        where: {
          pageId
        }
      });
      const newPermission = await upsertPermission(pageId, permissionData, undefined, tx);

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
    },
    {
      timeout: 20000
    }
  );

  if (isNewSpaceMember) {
    await sendMagicLink({ email: userIdAsEmail, redirectUrl: `/${spaceDomain}/${page.path}` });
  }

  return res.status(201).json(createdPermission);
}

async function removePagePermission(req: NextApiRequest, res: NextApiResponse) {
  const { permissionId } = req.body as IPagePermissionToDelete;

  const permission = await getPagePermission(permissionId);

  if (!permission) {
    throw new PermissionNotFoundError(permissionId);
  }

  const computedPermissions = await computeUserPagePermissions({
    resourceId: permission.pageId,
    userId: req.session.user.id
  });

  if (permission.public && computedPermissions.edit_isPublic !== true) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  } else if (!permission.public && computedPermissions.grant_permissions !== true) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  }

  await deletePagePermission(permissionId);

  updateTrackPageProfile(permission.pageId);

  return res.status(200).json({
    success: true
  });
}

export default withSessionRoute(handler);
