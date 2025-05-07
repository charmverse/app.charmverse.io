import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createMemberPropertyPermission } from '@packages/lib/members/createMemberPropertyPermission';
import { deleteMemberPropertyPermission } from '@packages/lib/members/deleteMemberPropertyPermission';
import type {
  CreateMemberPropertyPermissionInput,
  MemberPropertyPermissionWithRole
} from '@packages/lib/members/interfaces';
import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createMemberPropertyPermissionHandler)
  .delete(deleteMemberPropertyPermissionHandler);

async function createMemberPropertyPermissionHandler(
  req: NextApiRequest,
  res: NextApiResponse<MemberPropertyPermissionWithRole>
) {
  const permissionData = req.body as CreateMemberPropertyPermissionInput;

  const permission = await createMemberPropertyPermission(permissionData);

  return res.status(201).json(permission);
}

async function deleteMemberPropertyPermissionHandler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Remove check for req.body after user browsers are updated - 06/2023
  const { permissionId } = (req.query || req.body) as { permissionId: string };

  await deleteMemberPropertyPermission(permissionId);

  return res.status(200).json({
    success: true
  });
}

export default withSessionRoute(handler);
