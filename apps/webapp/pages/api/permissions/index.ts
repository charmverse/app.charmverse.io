import { log } from '@charmverse/core/log';
import type {
  AssignedPagePermission,
  PagePermissionAssignmentByValues,
  PermissionResource,
  TargetPermissionGroup
} from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { updateTrackPageProfile } from '@packages/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { DataNotFoundError } from '@packages/utils/errors';
import { isValidEmail } from '@packages/utils/strings';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { sendPageInviteEmail } from '@packages/lib/mailer/sendPageInviteEmail';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { requirePaidPermissionsSubscription } from '@packages/lib/middleware/requirePaidPermissionsSubscription';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { addGuest } from '@packages/lib/roles/addGuest';
import { withSessionRoute } from '@packages/lib/session/withSession';

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

  const pageWithType = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId as string
    },
    select: {
      type: true
    }
  });

  if (
    (pageWithType.type === 'proposal' || pageWithType.type === 'proposal_template') &&
    permissionData.assignee.group !== 'public'
  ) {
    throw new ActionNotPermittedError('You cannot manually update permissions for proposals.');
  }

  const computedPermissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId: req.session.user.id
  });

  if (!computedPermissions.grant_permissions) {
    throw new ActionNotPermittedError('You cannot edit permissions for this page');
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
      path: true,
      title: true,
      space: {
        select: {
          domain: true
        }
      }
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
  const userEmail = userIdAsEmail && isValidEmail(userIdAsEmail) ? userIdAsEmail : null;

  // Handle case where we are sharing a page to a user by email
  if (userEmail) {
    const addGuestResult = await addGuest({
      spaceId: page.spaceId,
      userIdOrEmail: userEmail
    });
    (permissionData.assignee as TargetPermissionGroup<'user'>).id = addGuestResult.user.id;

    log.info('Member shared a page with a guest by email', {
      pageId,
      spaceId: page.spaceId,
      guestUserId: addGuestResult.user.id,
      userId: req.session.user.id
    });
  }

  const createdPermission = await req.premiumPermissionsClient.pages.upsertPagePermission({
    pageId,
    permission: permissionData
  });

  // notify a user the doc has been shared
  if (createdPermission.assignee.group === 'user') {
    const userId = (createdPermission.assignee as TargetPermissionGroup<'user'>).id;
    // get the email of the user, if available
    const notificationEmail =
      userEmail ||
      (await prisma.user
        .findUniqueOrThrow({
          where: {
            id: userId
          },
          select: {
            googleAccounts: true,
            verifiedEmails: true
          }
        })
        // TODO: maybe support checking user.email, but we would need to look for it when logging in thru magic link
        .then((user) => user.googleAccounts[0]?.email || user.verifiedEmails[0]?.email));
    if (notificationEmail) {
      const sender = await prisma.user.findUniqueOrThrow({
        where: {
          id: req.session.user.id
        }
      });
      await sendPageInviteEmail({
        guestEmail: notificationEmail,
        to: { email: notificationEmail, userId },
        pageId,
        pageTitle: page.title,
        invitingUserName: sender.username
      });
    }
  }

  updateTrackPageProfile(pageId);

  log.info('User added page permissions', {
    pageId,
    permission: createdPermission,
    userId: req.session.user.id
  });

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

  if (!computedPermissions.grant_permissions) {
    throw new ActionNotPermittedError('You cannot edit permissions for this page');
  }

  await req.premiumPermissionsClient.pages.deletePagePermission({ permissionId });

  updateTrackPageProfile(permission.pageId);

  log.info('User removed page permissions', {
    pageId: permission.pageId,
    permission,
    userId: req.session.user.id
  });

  return res.status(200).json({
    success: true
  });
}

export default withSessionRoute(handler);
