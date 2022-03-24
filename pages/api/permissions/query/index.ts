
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Page, PaymentMethod } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, requireSpaceMembership, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { IApiError } from 'lib/utilities/errors';
import { isValidChainAddress } from 'lib/tokens/validation';
import { evaluatePagePermission } from 'lib/permissions/pages';
import { IActionRequest, IUserPermissionsRequest } from 'lib/permissions/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership)
  .post(queryPermissions);

async function queryPermissions (req: NextApiRequest, res: NextApiResponse) {

  const { identifiers } = req.body as IUserPermissionsRequest;

  await evaluatePagePermission();

  return res.status(200).json({});
}

export default withSessionRoute(handler);
