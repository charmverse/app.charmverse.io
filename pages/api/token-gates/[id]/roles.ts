
import { TokenGateToRole } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['roleIds', 'spaceId'], 'body'))
  .use(requireSpaceMembership({ adminOnly: true }))
  .post(updateTokenGateRoles);

async function updateTokenGateRoles (req: NextApiRequest, res: NextApiResponse<TokenGateToRole[]>) {
  const { roleIds } = req.body as {roleIds: string[]};
  const roleIdsSet = new Set(roleIds);
  const tokenGateId = req.query.id as string;

  const tokenGateRoles = await prisma.tokenGateToRole.findMany({
    where: {
      tokenGateId
    },
    select: {
      roleId: true
    }
  });

  const tokenGateRoleIds = new Set(tokenGateRoles.map(role => role.roleId));
  const tokenGateRoleIdsToAdd = roleIds.filter(roleId => !tokenGateRoleIds.has(roleId));
  const tokenGateRoleIdsToRemove = Array.from(tokenGateRoleIds).filter(tokenGateRoleId => !roleIdsSet.has(tokenGateRoleId));

  if (tokenGateRoleIdsToAdd.length !== 0) {
    await prisma.tokenGateToRole.createMany({
      data: tokenGateRoleIdsToAdd.map(tokenGateRoleIdToAdd => ({
        roleId: tokenGateRoleIdToAdd,
        tokenGateId
      }))
    });
  }

  if (tokenGateRoleIdsToRemove.length !== 0) {
    await prisma.tokenGateToRole.deleteMany({
      where: {
        tokenGateId,
        roleId: {
          in: tokenGateRoleIdsToRemove
        }
      }
    });
  }

  // Return the updated tokenGate to role records attached with the token gate
  // This will help in updating the cache on the client side
  const tokenGateToRoles = await prisma.tokenGateToRole.findMany({
    where: {
      tokenGateId
    }
  });

  return res.status(200).json(tokenGateToRoles);
}

export default withSessionRoute(handler);
