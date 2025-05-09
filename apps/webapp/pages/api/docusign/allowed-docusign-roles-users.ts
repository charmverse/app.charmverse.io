import type { DocusignAllowedRoleOrUser } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import {
  getAllowedDocusignRolesAndUsers,
  updateAllowedDocusignRolesAndUsers
} from '@packages/lib/docusign/allowedDocusignRolesAndUsers';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(
    requireSpaceMembership({ adminOnly: false, location: 'query', spaceIdKey: 'spaceId' }),
    getAllowedDocusignRolesAndUsersController
  )
  .put(
    requireSpaceMembership({ adminOnly: true, location: 'body', spaceIdKey: 'spaceId' }),
    updateAllowedDocusignRolesAndUsersController
  );

async function getAllowedDocusignRolesAndUsersController(
  req: NextApiRequest,
  res: NextApiResponse<DocusignAllowedRoleOrUser[]>
) {
  const allowedUsersAndRoles = await getAllowedDocusignRolesAndUsers({ spaceId: req.query.spaceId as string });

  return res.status(200).json(allowedUsersAndRoles);
}

async function updateAllowedDocusignRolesAndUsersController(req: NextApiRequest, res: NextApiResponse) {
  await updateAllowedDocusignRolesAndUsers(req.body);

  return res.status(200).json({ success: true });
}

export default withSessionRoute(handler);
