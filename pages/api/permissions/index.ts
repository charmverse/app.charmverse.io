
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Page, PaymentMethod, PagePermission, PagePermissionLevel } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, requireSpaceMembership, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { IApiError } from 'lib/utilities/errors';
import { isValidChainAddress } from 'lib/tokens/validation';
import { evaluatePagePermission, permissionTemplates, IPagePermissionFlags } from 'lib/permissions/pages';
import { } from 'lib/permissions/interfaces';
import { isTruthy } from 'lib/utilities/types';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
//  .use(requireSpaceMembership)
  .post(createPagePermission)
  .delete(deletePagePermission);

async function createPagePermission (req: NextApiRequest, res: NextApiResponse) {

  const permission = req.body as PagePermission;

  const permissionLevel = permission.permissionLevel;

  if (!isTruthy(permissionLevel) || !isTruthy(PagePermissionLevel[permissionLevel])) {
    return res.status(400).send({
      error: 'Please provide a valid permission level'
    });
  }

  // We store permissions in the database.
  // If permission templates accidentally get changed in future, existing permissions will not be affected
  const permissionTemplate = { ...permissionTemplates[permission.permissionLevel] };

  const permissionToCreate = {
    permissionLevel: permission.permissionLevel,
    ...permissionTemplate,
    page: {
      connect: {
        id: permission.pageId
      }
    }

  } as Prisma.PagePermissionCreateInput;

  // Ensure only 1 group at a time is linked to this permission
  if (permission.userId) {
    permissionToCreate.user = {
      connect: {
        id: permission.userId
      }
    };
  }
  else if (permission.roleId) {
    permissionToCreate.role = {
      connect: {
        id: permission.roleId
      }
    };
  }
  else if (permission.spaceId) {
    permissionToCreate.space = {
      connect: {
        id: permission.spaceId
      }
    };
  }
  else {
    return res.status(400).send({
      error: 'Permissions must be linked to a user, role or space'
    });

  }

  const created = await prisma.pagePermission.create({ data: permissionToCreate });

  return res.status(200).json({
    created
  });
}

async function deletePagePermission (req: NextApiRequest, res: NextApiResponse) {

  const { permissionId } = req.body as any;

  await prisma.pagePermission.delete({
    where: {
      id: permissionId
    }
  });

  return res.status(200).json({
    success: true
  });
}

export default withSessionRoute(handler);
