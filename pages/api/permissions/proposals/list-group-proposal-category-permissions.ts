import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import type { AssignedProposalCategoryPermission } from 'lib/permissions/proposals/interfaces';
import type { PermissionsGroupQuery } from 'lib/permissions/proposals/listGroupProposalCategoryPermissions';
import { listGroupProposalCategoryPermissions } from 'lib/permissions/proposals/listGroupProposalCategoryPermissions';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys<PermissionsGroupQuery>(['id', 'group'], 'query')).get(listPermissions);

async function listPermissions(req: NextApiRequest, res: NextApiResponse<AssignedProposalCategoryPermission[]>) {
  const input = req.query as PermissionsGroupQuery;

  const permissions = await listGroupProposalCategoryPermissions({
    id: input.id,
    group: input.group
  });
  res.status(200).json(permissions);
}

export default withSessionRoute(handler);
