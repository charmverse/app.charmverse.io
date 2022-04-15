
import { Role } from '@prisma/client';
import { prisma } from 'db';
import { ApiError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { requireSpaceMembership } from 'lib/middleware/requireSpaceMembership';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireSpaceMembership())
  .put(updateRole);

async function updateRole (req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body as Role;

  const { id } = req.query;

  if (!id) {
    throw new ApiError({
      message: 'Please provide a valid role id',
      errorType: 'Invalid input'
    });
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
