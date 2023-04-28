import { prisma } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { PermissionToDelete } from 'lib/permissions/interfaces';
import { computeProposalCategoryPermissions } from 'lib/permissions/proposals/computeProposalCategoryPermissions';
import { deleteProposalCategoryPermission } from 'lib/permissions/proposals/deleteProposalCategoryPermission';
import type { AssignedProposalCategoryPermission } from 'lib/permissions/proposals/interfaces';
import { upsertProposalCategoryPermission } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .delete(requireKeys<PermissionToDelete>(['permissionId'], 'body'), removeProposalCategoryPermission)
  .post(upsertProposalCategoryPermissionController);

async function upsertProposalCategoryPermissionController(
  req: NextApiRequest,
  res: NextApiResponse<AssignedProposalCategoryPermission>
) {
  const input = req.body as AssignedProposalCategoryPermission;

  const permissions = await computeProposalCategoryPermissions({
    resourceId: input.proposalCategoryId,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  const newPermission = await upsertProposalCategoryPermission(input);

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

  const permissions = await computeProposalCategoryPermissions({
    resourceId: proposalCategory.id,
    userId: req.session.user.id
  });

  if (!permissions.manage_permissions) {
    throw new ActionNotPermittedError('You cannot manage permissions for this category.');
  }

  await deleteProposalCategoryPermission({ permissionId });

  res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
