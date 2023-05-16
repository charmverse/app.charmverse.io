import type { AssignedProposalCategoryPermission } from '@charmverse/core';
import { prisma } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requirePaidPermissionsSubscription } from 'lib/middleware/requirePaidPermissionsSubscription';
import type { PermissionToDelete } from 'lib/permissions/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .delete(
    requirePaidPermissionsSubscription({
      key: 'permissionId',
      location: 'body',
      resourceIdType: 'proposalCategoryPermission'
    }),
    removeProposalCategoryPermission
  )
  .post(
    requirePaidPermissionsSubscription({
      key: 'proposalCategoryId',
      location: 'body',
      resourceIdType: 'proposalCategory'
    }),
    upsertProposalCategoryPermissionController
  );

async function upsertProposalCategoryPermissionController(
  req: NextApiRequest,
  res: NextApiResponse<AssignedProposalCategoryPermission>
) {
  const input = req.body as AssignedProposalCategoryPermission;

  const permissions = await req.basePermissionsClient.proposals.computeProposalCategoryPermissions({
    resourceId: input.proposalCategoryId,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  const newPermission = await req.premiumPermissionsClient.proposals.upsertProposalCategoryPermission(input);

  res.status(201).json(newPermission);
}

async function removeProposalCategoryPermission(req: NextApiRequest, res: NextApiResponse) {
  const { permissionId } = req.body as PermissionToDelete;

  const proposalCategory = await prisma.proposalCategory.findFirst({
    where: {
      proposalCategoryPermissions: {
        some: {
          id: permissionId
        }
      }
    }
  });

  if (!proposalCategory) {
    throw new DataNotFoundError('Proposal category not found');
  }

  const permissions = await req.basePermissionsClient.proposals.computeProposalCategoryPermissions({
    resourceId: proposalCategory.id,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  await req.premiumPermissionsClient.proposals.deleteProposalCategoryPermission({
    permissionId
  });
  res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
