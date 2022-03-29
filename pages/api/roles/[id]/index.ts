
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Prisma, Role, SpaceRoleToRole, User } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { IApiError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership())
  .put(updateRole);

async function updateRole (req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body as Role;

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Please provide a valid role id' } as any);
  }

  const updatedRole = await prisma.role.update({
    where: {
      id: id as string
    },
    data: {
      name
    }
  });

  return res.status(200).json(updatedRole);
}

export default withSessionRoute(handler);
