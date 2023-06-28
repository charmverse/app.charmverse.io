import type {
  AssignedPagePermission,
  PagePermissionAssignmentByValues,
  PermissionResource,
  TargetPermissionGroup
} from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { sendMagicLink } from 'lib/google/sendMagicLink';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import { addGuest } from 'lib/roles/addGuest';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { isValidEmail } from 'lib/utilities/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(
    requirePaidPermissionsSubscription({ key: 'pageId', location: 'query', resourceIdType: 'page' }),
    findPagePermissions
  )
  .delete(
    requirePaidPermissionsSubscription({ key: 'permissionId', resourceIdType: 'pagePermission' }),
    removePagePermission
  )
  .use(requireKeys(['pageId'], 'body'))
  .post(
    requirePaidPermissionsSubscription({ key: 'pageId', location: 'body', resourceIdType: 'page' }),
    addPagePermission
  );

async function findPagePermissions(req: NextApiRequest, res: NextApiResponse<AssignedPagePermission[]>) {
  const { pageId } = req.query;

  const permissions = await req.premiumPermissionsClient.pages.listPagePermissions({
    resourceId: pageId as string
  });

  return res.status(200).json(permissions);
}

async function addPagePermission(req: NextApiRequest, res: NextApiResponse<AssignedPagePermission>) {
  const { pageId, permission: permissionData } = req.body as {
    pageId: string;
    permission: PagePermissionAssignmentByValues;
  };

  const computedPermissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId: req.session.user.id
  });

  if (permissionData.assignee.group === 'public' && computedPermissions.edit_isPublic !== true) {
    throw new ActionNotPermittedError('You cannot make page public.');
  } else if (permissionData.assignee.group !== 'public' && computedPermissions.grant_permissions !== true) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  } else if (permissionData.permissionLevel === 'proposal_editor') {
    throw new ActionNotPermittedError('This permission level can only be created automatically by proposals.');
  } else if (permissionData.assignee.group === 'public' && permissionData.permissionLevel !== 'view') {
    throw new ActionNotPermittedError('Only view permissions can be provided to public.');
  }

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

  if (page.type === 'proposal' && permissionData.assignee.group !== 'public') {
    throw new ActionNotPermittedError('You cannot manually update permissions for proposals.');
  }

  // Usually a userId, but can be an email
  const userIdAsEmail = permissionData.assignee.group === 'user' ? permissionData.assignee.id : null;

  // Store these in top level scope, so we can send an email to the user after the page permission is created
  let isNewSpaceMember = false;
  let spaceDomain: string = '';

  // Handle case where we are sharing a page
  if (userIdAsEmail && isValidEmail(userIdAsEmail)) {
    const addGuestResult = await addGuest({
      spaceId: page.spaceId,
      userIdOrEmail: userIdAsEmail
    });

    isNewSpaceMember = addGuestResult.isNewSpaceRole;
    spaceDomain = addGuestResult.spaceDomain;

    (permissionData.assignee as TargetPermissionGroup<'user'>).id = addGuestResult.user.id;
  }

  const createdPermission = await req.premiumPermissionsClient.pages.upsertPagePermission({
    pageId,
    permission: permissionData
  });

  updateTrackPageProfile(pageId);

  if (isNewSpaceMember) {
    await sendMagicLink({ email: userIdAsEmail as string, redirectUrl: `/${spaceDomain}/${page.path}` });
  }

  return res.status(201).json(createdPermission);
}

async function removePagePermission(req: NextApiRequest, res: NextApiResponse) {
  const { permissionId } = (req.query || req.body) as PermissionResource;

  const permission = await prisma.pagePermission.findUnique({
    where: { id: permissionId },
    select: { public: true, pageId: true }
  });

  if (!permission) {
    throw new DataNotFoundError(permissionId);
  }

  const computedPermissions = await req.premiumPermissionsClient.pages.computePagePermissions({
    resourceId: permission.pageId,
    userId: req.session.user.id
  });

  if (permission.public && computedPermissions.edit_isPublic !== true) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  } else if (!permission.public && computedPermissions.grant_permissions !== true) {
    throw new ActionNotPermittedError('You cannot manage permissions for this page');
  }

  await req.premiumPermissionsClient.pages.deletePagePermission({ permissionId });

  updateTrackPageProfile(permission.pageId);

  return res.status(200).json({
    success: true
  });
}

export default withSessionRoute(handler);
