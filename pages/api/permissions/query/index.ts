
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Page, PaymentMethod, PagePermission, PagePermissionLevel } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, requireSpaceMembership, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { IApiError } from 'lib/utilities/errors';
import { isValidChainAddress } from 'lib/tokens/validation';
import { evaluatePagePermission, permissionTemplates, IPagePermissionRequest, IPagePermissionListRequest } from 'lib/permissions/pages';
import { isTruthy } from 'lib/utilities/types';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(listPermissions)
  .post(queryPermissions);

async function listPermissions (req: NextApiRequest, res: NextApiResponse) {

  const { pageId } = req.query as any as IPagePermissionListRequest;

  const permissions = await prisma.pagePermission.findMany({
    where: {
      pageId
    },
    include: {
      role: true,
      space: true,
      user: true
    }
  });

  return res.status(200).json(permissions);
}

async function queryPermissions (req: NextApiRequest, res: NextApiResponse) {

  const request = req.body as IPagePermissionRequest;

  const test = await evaluatePagePermission(request);

  return res.status(200).json(test);
}

export default withSessionRoute(handler);
