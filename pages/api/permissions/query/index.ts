
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Page, PaymentMethod, PagePermission, PagePermissionLevel } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, requireSpaceMembership, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { IApiError } from 'lib/utilities/errors';
import { isValidChainAddress } from 'lib/tokens/validation';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { isTruthy } from 'lib/utilities/types';
import { IPagePermissionUserRequest } from 'lib/permissions/pages/page-permission-interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<IPagePermissionUserRequest>(['pageId', 'userId'], 'body'))
  .post(queryPagePermissions);

async function queryPagePermissions (req: NextApiRequest, res: NextApiResponse) {

  const request = req.body as IPagePermissionUserRequest;

  const userPermissions = await computeUserPagePermissions(request);

  return res.status(200).json(userPermissions);
}

export default withSessionRoute(handler);
